# stdlib imports
import enum


# Simple string messages for errors returned by the api
class ApiError(enum.Enum):
    NO_PERMISSION = "You do not have permission to do this"
    BANKER_CANNOT_LEAVE = "You are the banker. You cannot leave."
    KICK_NOT_FOUND = "Target player not found"
    KICK_YOURSELF = "You cannot kick yourself"
    PLY_NAME_BLACKLIST = "That player name is not allowed"
    PLY_NOT_ACTIVE = "You are no longer part of this lobby"
    PLY_NOT_BANKER = "You are not the banker!"
    LOBBY_CODE_INVALID = "Lobby with this code does not exist"
    LOBBY_FULL = "This lobby is full"
    LOBBY_EXPIRED = "This lobby has expired"
    LOBBY_INVALID = "Invalid lobby data"
    SESSION_INVALID = "Invalid session data"
    TRANSFER_INVALID_SRC = "Invalid transfer source"
    TRANSFER_FUNDS = "Insufficient funds"
    TRANSFER_INVALID_DEST = "Invalid transfer destination"


# Dictionary map of enum, for sending to front-end
apiErrorMap = {mem.name: mem.value for mem in ApiError}


# Messages for event objects. Contain formatting placeholders.
class Common(enum.Enum):
    # Event strings
    EVENT_BANK_TRANSFER_START = (
        "The Bank transferred {0} to {1} to get them started."
    )
    EVENT_PLY_JOIN = "{0} joined the game."
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
commonMap = {mem.name: mem.value for mem in Common}
