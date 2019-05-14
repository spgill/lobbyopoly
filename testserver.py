import requests
import msgpack

import server.helpers

s = requests.Session()
s.headers.update({"content-type": "application/msgpack"})

root = "http://localhost:5000"

print("INITIAL STATE")
print("COOKIES", s.cookies)

print()

print("TESTING PREFLIGHT")
resp = s.get(f"{root}/api/preflight")
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()
print("COOKIES", s.cookies)
print()

print("TESTING CREATE/JOIN")
resp = s.post(
    f"{root}/api/join", data=server.helpers.packMessage({"name": "Player X"})
)
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()
print("COOKIES", s.cookies)
print()

print("TESTING POLL")
resp = s.get(f"{root}/api/poll")
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()

print("TESTING TRANSFER")
resp = s.post(
    f"{root}/api/transfer",
    data=server.helpers.packMessage(
        {"source": "__me__", "destination": "__freeParking__", "amount": 10}
    ),
)
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()

print("TESTING BANK TRANSFER")
resp = s.post(
    f"{root}/api/transfer",
    data=server.helpers.packMessage(
        {"source": "__bank__", "destination": "__me__", "amount": 10}
    ),
)
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()

print("TESTING ILLICIT TRANSFER")
resp = s.post(
    f"{root}/api/transfer",
    data=server.helpers.packMessage(
        {"source": "__me__", "destination": "__bank__", "amount": 1000000}
    ),
)
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()

print("TESTING POLL FOR RESULTS")
resp = s.get(f"{root}/api/poll")
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()

print("TESTING LEAVE")
resp = s.get(f"{root}/api/leave")
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()


print("TESTING EVENTS")
resp = s.get(f"{root}/api/events")
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()
