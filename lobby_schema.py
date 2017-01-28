# Import builtin packages

# Import third party packages
import mongoengine as me

# Import local modules


class Player(me.EmbeddedDocument):
    name = me.StringField()
    balance = me.IntField(min_value=0, default=0)
    session = me.StringField()


class Lobby(me.Document):
    code = me.StringField(max_length=4)
    bank = me.IntField(min_value=0, default=15140)
    banker = me.StringField()
    parking = me.IntField(min_value=0, default=0)
    players = me.EmbeddedDocumentListField(Player)
    expires = me.DateTimeField()
