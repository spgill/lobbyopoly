# stdlib imports
import gzip

# vendor imports
import flask
import msgpack
import werkzeug

# local imports


def packMessage(data={}):
    """Pack a data object into a msgpack message."""
    return msgpack.packb(data, use_bin_type=True)


def unpackMessage(payload):
    """Unpack a msgpack message into Python data."""
    return msgpack.unpackb(
        payload, raw=False, max_bin_len=1 * 1024 * 1024  # 1 megabyte, fyi
    )


def parseRequest():
    if flask.request.headers.get("content-type", "") != "application/msgpack":
        raise werkzeug.exceptions.HTTPException(
            response=flask.make_response(
                ("Invalid Content-Type of request body", 400, {})
            )
        )
    return unpackMessage(flask.request.data)


# Default headers used for responses
defaultHeaders = {"content-type": "application/msgpack"}


def composeResponse(data):
    payload = packMessage(data)
    headers = {}
    headers.update(defaultHeaders)

    # Compress payload in gzip if allowed by client
    if (
        "gzip" in flask.request.headers["accept-encoding"]
        and len(payload) >= 32
    ):
        headers["content-encoding"] = "gzip"
        payload = gzip.compress(payload, 5)

    return flask.make_response(payload, 200, headers)


def composeError(message="Server Error"):
    return composeResponse({"__error__": message})
