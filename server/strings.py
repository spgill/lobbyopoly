# stdlib imports
import enum


class Bundle(enum.Enum):
    # Error strings
    ERROR_BANKER_CANNOT_LEAVE = "You are the banker. You cannot leave."
    ERROR_KICK_NOT_FOUND = "Target player not found"
    ERROR_KICK_YOURSELF = "You cannot kick yourself"
    ERROR_PLY_NAME_BLACKLIST = "That player name is not allowed"
    ERROR_PLY_NOT_ACTIVE = "You are no longer part of this lobby"
    ERROR_PLY_NOT_BANKER = "You are not the banker!"
    ERROR_LOBBY_CODE_INVALID = "Lobby with this code does not exist"
    ERROR_LOBBY_FULL = "This lobby is full"
    ERROR_LOBBY_EXPIRED = "This lobby has expired"
    ERROR_LOBBY_INVALID = "Invalid lobby data"
    ERROR_SESSION_INVALID = "Invalid session data"
    ERROR_TRANSFER_INVALID_SRC = "Invalid transfer source"
    ERROR_TRANSFER_FUNDS = "Insufficient funds"
    ERROR_TRANSFER_INVALID_DEST = "Invalid transfer destination"
    ERROR_INVALID_OPTIONS = "Invalid game options"

    # Event strings
    EVENT_PLY_JOIN = "{0} joined the game. The Bank gave them {1} to get started."
    EVENT_PLY_MADE_BANKER = "{0} has been made The Banker."
    EVENT_PLY_TRANSFER_BANKER = (
        "{0} transferred Banker responsibilities to {1}."
    )
    EVENT_PLY_LEAVE = (
        "A player has left. Their cash has been returned to the bank."
    )
    EVENT_PLY_KICK = (
        "A player has been kicked. Their cash has been returned to the bank."
    )
    EVENT_TRANSFER = "{0} transferred {1} from {2} to {3}."
    EVENT_DISBANDED = "The lobby has been disbanded."

    # Transfer inserts
    TRANSFER_SELF = "themself"
    TRANSFER_BANK = "The Bank"
    TRANSFER_FP = "Free Parking"


# Dictionary map of enum, for sending to front-end
bundleMap = {mem.name: mem.value for mem in Bundle}


# Enum representing the various entities players can transfer fund to/from
class TransferEntity(enum.Enum):
    SELF = "__self__"
    BANK = "__bank__"
    FP = "__fp__"


# Dictionary of the transfer entities
transferEntityMap = {mem.name: mem.value for mem in TransferEntity}


# Blacklist of names players cannot use
playerNameBlacklist = [
    "player",
    "themself",
    "themselves",
    "the bank",
    "bank",
    "banker",
    "the",
    "free parking",
    "free",
    "parking",
    "__self__",
    "__bank__",
    "__fp__",
]
