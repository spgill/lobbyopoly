# stdlib imports
import enum


class ApiError(enum.Enum):
    PLY_NAME_BLACKLIST = "That player name is not allowed"
    LOBBY_CODE_INVALID = "Lobby with this code does not exist"
    LOBBY_FULL = "This lobby is full"


# Map from enum members to index value
apiErrorMap = {
    mem[1]: idx for idx, mem in enumerate(ApiError.__members__.items())
}

# List of error strings in proper index order
apiErrorList = [mem[1].value for mem in ApiError.__members__.items()]
