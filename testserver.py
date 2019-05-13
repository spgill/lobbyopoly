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

print("TESTING JOIN")
resp = s.get(
    f"{root}/api/join", data=server.helpers.packMessage({"Testing": 123})
)
print(resp)
print(resp.headers)
print(resp.content)
if "msgpack" in resp.headers.get("content-type"):
    print("UNPACKED", server.helpers.unpackMessage(resp.content))

print()
print("COOKIES", s.cookies)
print()
