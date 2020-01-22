# stdlib imports
import datetime

# vendor imports
from bson.objectid import ObjectId
import mongoengine as mongo

# local imports


class Player(mongo.EmbeddedDocument):
    """Object representing a single player"""

    meta = {"collection": "players"}

    # Player information
    id = mongo.ObjectIdField(
        required=True, default=ObjectId, unique=True, primary_key=True
    )
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
    disbanded = mongo.BooleanField()

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
    key = mongo.StringField()
    inserts = mongo.ListField(mongo.DynamicField(), default=[])

    def __init__(self, *args, **kwargs):

        # Convert the enum member to its name
        kwargs["key"] = kwargs["key"].name

        super().__init__(*args, **kwargs)
