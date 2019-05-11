# vendor imports
import mongoengine as mongo


class Lobby(mongo.Document):
    """Object representing a single lobby of many players."""

    meta = {"collection": "lobbies"}

    # Session information
    code = mongo.StringField()
    created = mongo.DateTimeField()
    expires = mongo.DateTimeField()
    logHash = mongo.StringField()

    # Player information
    players = mongo.ListField(mongo.StringField())
    playerBalances = mongo.ListField(mongo.IntField())

    # Banker information
    banker = mongo.IntField()
    bankerBalance = mongo.IntField()

    # Other balances
    freeParking = mongo.IntField()


class Event(mongo.Document):
    """Object representing a single event in a lobby."""

    meta = {"collection": "events"}

    # Contents of the event
    lobby = mongo.LazyReferenceField(Lobby)
    time = mongo.DateTimeField()
    text = mongo.StringField()
