# stdlib imports

# vendor imports
import flask
import msgpack

# local imports


def packMessage(data={}):
    """Pack a data object into a msgpack message."""
    return msgpack.packb(data, use_bin_type=True)


def unpackMessage(payload):
    """Unpack a msgpack message into Python data."""
    return msgpack.unpackb(
        payload, raw=False, max_bin_len=1 * 1024 * 1024  # 1 megabyte, fyi
    )


# Default headers used for
defaultHeaders = {"content-type": "application/msgpack"}


def composeResponse(data):
    return flask.make_response(packMessage(data), 200, defaultHeaders)


def composeError(message="Server Error"):
    return composeResponse({"__error__": message})
