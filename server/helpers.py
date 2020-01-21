# stdlib imports
import datetime
import gzip
import struct

# vendor imports
from bson.objectid import ObjectId
import flask
import msgpack
import werkzeug

# local imports


def _customEncoder(obj):
    # Cast ObjectId's to strings
    if isinstance(obj, ObjectId):
        return str(obj)

    # Custom type 0x30 is a UTC POSIX timestamp
    elif isinstance(obj, datetime.datetime):
        return msgpack.ExtType(
            0x30,
            struct.pack(
                "f", obj.replace(tzinfo=datetime.timezone.utc).timestamp()
            ),
        )
    return obj


def packMessage(data={}):
    """Pack a data object into a msgpack message."""
    return msgpack.packb(data, default=_customEncoder, use_bin_type=True)


def unpackMessage(payload):
    """Unpack a msgpack message into Python data."""
    return msgpack.unpackb(
        payload, raw=False, max_bin_len=1 * 1024 * 1024  # 1 megabyte, fyi
    )


def parseRequestData():
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
        "gzip" in flask.request.headers.get("accept-encoding", "")
        and len(payload) >= 256
    ):
        headers["content-encoding"] = "gzip"
        headers["unencoded-length"] = str(len(payload))
        payload = gzip.compress(payload, 5)

    return flask.make_response(payload, 200, headers)


def composeError(error):
    return composeResponse({"__error__": error.name})
