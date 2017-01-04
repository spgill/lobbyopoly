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
        ply.save()

    # If user is new, add them to the lobby
    if not ply:
        ply = Player(
            name=data['name'],
            session=flask.request.sid
        )

        lobby.players.append(ply)
        lobby.save()

    # Finally, emit the completion
    emit('player.connect complete')

    # Send an update to all lobby players
    lobby_update(
        lobby,
        f'{ply.name} has joined the lobby'
    )
