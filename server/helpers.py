# stdlib imports
import typing

# vendor imports

# local imports
from . import strings


def composeResponse(
    data: typing.Optional[typing.Any] = None,
    error_code: typing.Optional[strings.Bundle] = None,
) -> dict[str, typing.Any]:
    return {"error": error_code.name if error_code else None, "payload": data}


def composeError(error: strings.Bundle):
    return composeResponse(None, error)
