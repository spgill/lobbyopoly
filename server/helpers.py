# stdlib imports
import datetime
import gzip
import struct
import typing

# vendor imports
from bson.objectid import ObjectId
import fastapi
import msgpack

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
                "!d",
                obj.replace(tzinfo=datetime.timezone.utc).timestamp(),
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


async def parseRequestData(request: fastapi.Request) -> dict:
    if request.headers.get("content-type", "") != "application/msgpack":
        raise fastapi.HTTPException(
            status_code=400,
            detail="Expected body Content-Type to be 'application/msgpack'",
        )
    return unpackMessage(await request.body())


# Default headers used for responses
defaultHeaders = {"content-type": "application/msgpack"}


def composeResponse(data=None, error=None):
    payload = packMessage({"error": error, "payload": data})
    headers = {}
    headers.update(defaultHeaders)

    return fastapi.Response(payload, 200, headers)


def composeError(error):
    return composeResponse(None, error.name)
