# vendor imports
import mongoengine as mongo


class Player(mongo.Document):
    """Object representing a single player"""

    meta = {"collection": "players"}

    # Player information
    name = mongo.StringField()
    balance = mongo.IntField()


class Lobby(mongo.Document):
    """Object representing a single lobby of many players."""

    meta = {"collection": "lobbies"}

    # Session information
    code = mongo.StringField()
    created = mongo.DateTimeField()
    expires = mongo.DateTimeField()
    eventHash = mongo.StringField()

    # Player information
    players = mongo.ListField(mongo.ReferenceField(Player))

    # Banker information
    banker = mongo.ReferenceField(Player)
    bank = mongo.IntField()

    # Other balances
    freeParking = mongo.IntField()


class Event(mongo.Document):
    """Object representing a single event in a lobby."""

    meta = {"collection": "events"}

    # Contents of the event
    lobby = mongo.LazyReferenceField(Lobby)
    time = mongo.DateTimeField()
    text = mongo.StringField()
