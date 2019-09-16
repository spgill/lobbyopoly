# stdlib imports
import datetime

# vendor imports
from bson.objectid import ObjectId
import mongoengine as mongo


class Player(mongo.EmbeddedDocument):
    """Object representing a single player"""

    meta = {"collection": "players"}

    # Player information
    id = mongo.ObjectIdField(
        required=True, default=ObjectId, unique=True, primary_key=True
    )
    active = mongo.BooleanField()
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
    players = mongo.EmbeddedDocumentListField(Player)

    # Banker information
    banker = mongo.ObjectIdField()
    bank = mongo.IntField()

    # Other balances
    freeParking = mongo.IntField()

    def hasExpired(self):
        """Method to quickly check if the lobby has expired."""
        return self.expires <= datetime.datetime.utcnow()


class Event(mongo.Document):
    """Object representing a single event in a lobby."""

    meta = {"collection": "events"}

    # Contents of the event
    lobby = mongo.LazyReferenceField(Lobby)
    time = mongo.DateTimeField()
    text = mongo.StringField()
