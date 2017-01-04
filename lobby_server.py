import os

import flask
from flask_mongoengine import MongoEngine
from flask_socketio import SocketIO, send, emit

import lobby_helpers as helpers

# Initialize and configure the app
app = flask.Flask(__name__, static_folder='public', static_url_path='')
app.config['DEBUG'] = os.environ.get('DEBUG', False) == 'True'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2 megabytes, fyi
app.config['MONGODB_SETTINGS'] = {
    'host': os.environ.get('MONGODB_URI', None),
}

# Initialize SocketIO
socket = SocketIO(app)

# Initialize and configure the mongodb
db = MongoEngine(app)


class Player(db.EmbeddedDocument):
    name = db.StringField()
    balance = db.IntField(min_value=0, default=0)
    session = db.StringField()


class Lobby(db.Document):
    code = db.StringField(max_length=4)
    bank = db.IntField(min_value=0, default=15140)
    banker = db.StringField()
    parking = db.IntField(min_value=0, default=0)
    players = db.EmbeddedDocumentListField(Player)


# Index redirect
@app.route('/')
def index_redirect():
    return flask.redirect('/html/index.html')


@app.route('/test')
def test():
    return 'lol'


def lobby_update(lob, message=None, message_exclude=None):
    """Send updates to all players in the lobby."""
    # Start with an empty message
    payload = {}

    # Populate the players list
    payload['players'] = [ply.name for ply in lob.players]

    # Bank information
    payload['bank'] = lob.bank
    payload['banker'] = lob.banker
    payload['parking'] = lob.parking

    # Iterate through the players, sending them the message AND their balance
    for ply in lob.players:
        emit(
            'update',
            helpers.api_success(
                payload={**payload, 'balance': ply.balance},
                message=message
            ),
            room=ply.session
        )


@socket.on('player.connect')
def socket_player_connect(data):
    # Fetch the lobby
    try:
        lobby = Lobby.objects(code=data['code']).get()
    except db.DoesNotExist:
        code = data['code']
        emit(
            'error',
            helpers.api_error(message=f'Lobby "{code}" does not exist')
        )
        return

    # Check if the user is already a part of the lobby
    ply = None
    for p in lobby.players:
        if p.name == data['name']:
            ply = p

    # If player is returning, update their session id
    if ply:
        ply.session = flask.request.sid
        lobby.save()

    # If user is new, add them to the lobby
    if not ply:
        ply = Player(
            name=data['name'],
            session=flask.request.sid,
            balance=1500
        )

        lobby.players.append(ply)
        lobby.bank -= 1500
        lobby.save()

    # Finally, emit the completion
    emit('player.connect complete')

    # Send an update to all lobby players
    lobby_update(
        lobby,
        f'{ply.name} has joined the lobby'
    )


def balance_get(lob, name):
    if name == '__bank__':
        return lob.bank
    elif name == '__parking__':
        return lob.parking
    else:
        for ply in lob.players:
            if ply.name == name:
                return ply.balance


def balance_set(lob, name, amount):
    if name == '__bank__':
        lob.bank = amount
    elif name == '__parking__':
        lob.parking = amount
    else:
        for ply in lob.players:
            if ply.name == name:
                ply.balance = amount
                break
    lob.save()


@socket.on('transfer')
def socket_transfer(data):
    """Transfer money from one account to the other."""
    # Fetch the lobby
    lob = Lobby.objects(code=data['code']).get()

    # Get the from balance and check for sufficient funds
    from_balance = balance_get(lob, data['from'])

    if from_balance < data['amount']:
        print('INSUFFICIENT')
        emit('error', helpers.api_error(
            message='Insufficient balance'
        ))
        return

    # Update the from balance
    balance_set(lob, data['from'], from_balance - data['amount'])

    # Update the to balance
    balance_set(lob, data['to'], balance_get(lob, data['to']) + data['amount'])

    # Construct a message
    from_name = data['from']
    if from_name == '__bank__':
        from_name = 'The Bank'
    elif from_name == '__parking__':
        from_name = 'Free Parking'

    to_name = data['to']
    if to_name == '__bank__':
        to_name = 'the Bank'
    elif to_name == '__parking__':
        to_name = 'Free Parking'
    elif to_name == '__everyone__':
        to_name = 'Everyone'

    # Broadcast an update with a message
    lobby_update(lob, f'{from_name} sent ${data["amount"]} to {to_name}')
