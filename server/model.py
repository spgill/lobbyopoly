# vendor imports
import mongoengine as mongo


# # Define the database model
# class PrintAccount(mongoengine.Document):
#     """A document representing parties allowed to print to the server."""

#     meta = {"collection": "print_account"}

#     # Basic fields
#     secret = mongoengine.StringField()
#     name = mongoengine.StringField()
#     count = mongoengine.IntField(default=0)

#     # Rate limiting fields
#     rate = mongoengine.IntField(default=None)
#     last = mongoengine.DateTimeField()


# class PrintLog(mongoengine.Document):
#     """A document representing a single received ticket."""

#     meta = {"collection": "print_log"}

#     date = mongoengine.DateTimeField()
#     origin = mongoengine.StringField()
#     size = mongoengine.IntField()
#     account = mongoengine.ReferenceField("PrintAccount", required=False)
#     note = mongoengine.StringField(default=None)
#     dump = mongoengine.FileField()

# Define the database model
class Lobby(mongo.Document):
    meta = {"collection": "lobby"}

    token = mongo.StringField()
    created = mongo.DateTimeField()
    expires = mongo.DateTimeField()

    logHash = mongo.StringField()

    playerNames = mongo.ListField(mongo.StringField())
    playerBalances = mongo.ListField(mongo.IntField())

    banker = mongo.IntField()
    bankerBalance = mongo.IntField()

    freeParking = mongo.IntField()
