# stdlib imports
import datetime
import enum
import os
import typing

# vendor imports
from bson.objectid import ObjectId as BsonObjectId
import motor.motor_asyncio
import pydantic

# local imports


db_client: typing.Optional[motor.motor_asyncio.AsyncIOMotorClient] = None

# Co-opted from https://github.com/L0RD-ZER0/Motor-Types/blob/master/motor-stubs/core.pyi
_Document = typing.Mapping[str, typing.Any]


def get_db() -> motor.motor_asyncio.AsyncIOMotorDatabase:
    assert db_client is not None
    return db_client.get_default_database()


async def connect_and_init_db():
    print("Connecting to MongoDB...")
    mongodbUrl = os.environ.get("MONGODB_HOST", None)
    global db_client
    db_client = motor.motor_asyncio.AsyncIOMotorClient(mongodbUrl)


async def close_db_connect():
    print("Disconnecting from MongoDB...")
    global db_client
    if db_client is None:
        return
    db_client.close()
    db_client = None


class ObjectId(BsonObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


class AppBaseModel(pydantic.BaseModel):
    class Config:
        use_enum_values = True


M = typing.TypeVar("M", bound="MongoDocument")


class MongoDocument(AppBaseModel):
    collection: typing.ClassVar[str] = "CHANGE ME"

    id: ObjectId = pydantic.Field(default_factory=ObjectId, alias="_id")

    @classmethod
    def parse_document(cls, document: _Document):
        return cls.parse_obj(document)

    def document(self) -> _Document:
        return self.dict(by_alias=True)

    @classmethod
    async def get_by_id(cls: type[M], id: ObjectId) -> typing.Union[M, None]:
        db = get_db()
        results = await db[cls.collection].find_one({"_id": id})
        return cls.parse_document(results) if results is not None else None

    async def insert(self) -> None:
        db = get_db()
        await db[self.collection].insert_one(self.document())

    async def update(self) -> None:
        db = get_db()
        await db[self.collection].replace_one(
            {"_id": self.id}, self.document()
        )


class LobbyCurrency(enum.Enum):
    Dollars = "$"
    Pounds = "£"


class CreateLobbyForm(AppBaseModel):
    unlimitedBank: bool
    freeParking: bool
    maxPlayers: int
    bankBalance: int
    startingBalance: int
    currency: LobbyCurrency


class JoinLobbyForm(pydantic.BaseModel):
    code: str
    name: str


class Player(MongoDocument):
    id: ObjectId = pydantic.Field(default_factory=ObjectId, alias="_id")

    name: str
    balance: int


class Lobby(MongoDocument):
    collection: typing.ClassVar[str] = "lobbies"

    id: ObjectId = pydantic.Field(default_factory=ObjectId, alias="_id")

    # Lobby session information
    code: str
    created: datetime.datetime
    expires: datetime.datetime
    disbanded: bool
    options: CreateLobbyForm  # for now these are equivalent, but this may change in the future

    # Balances in the lobby
    bank: int
    freeParking: int

    # Id of the banker player
    banker: typing.Optional[ObjectId]

    # List of players in the lobby
    players: list[Player]

    def get_player(self, id: ObjectId) -> typing.Union[Player, None]:
        for player in self.players:
            if player.id == id:
                return player
        return None


EventInsertType = list[typing.Union[ObjectId, int, str]]


class Event(MongoDocument):
    collection: typing.ClassVar[str] = "events"

    id: ObjectId = pydantic.Field(default_factory=ObjectId, alias="_id")

    lobby: ObjectId
    time: datetime.datetime
    key: str
    inserts: list[EventInsertType]
