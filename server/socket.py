# stdlib imports

# vendor imports
import bson.json_util
import fastapi
import starlette.websockets
import typing

# local imports
from . import model


# Create the router
socketRouter = fastapi.APIRouter()


def compose_update_message(
    lobby: model.db.Lobby, events: list[model.db.Event]
) -> str:
    return bson.json_util.dumps(
        {
            "type": "update",
            "payload": {
                "lobby": lobby.document(),
                "events": [e.document() for e in events],
            },
        }
    )


def compose_kick_message(
    player: typing.Optional[model.db.Player] = None,
) -> str:
    return bson.json_util.dumps(
        {"type": "kick", "player": player.id if player else None}
    )


class ConnectionManager:
    def __init__(self) -> None:
        self.lobby_sockets: dict[
            model.db.ObjectId, list[fastapi.WebSocket]
        ] = {}

    def register_connection(
        self, lobby_id: model.db.ObjectId, sock: fastapi.WebSocket
    ) -> None:
        if lobby_id not in self.lobby_sockets:
            self.lobby_sockets[lobby_id] = []
        self.lobby_sockets[lobby_id].append(sock)

    def remove_connection(
        self, lobby_id: model.db.ObjectId, sock: fastapi.WebSocket
    ):
        if lobby_id in self.lobby_sockets:
            self.lobby_sockets[lobby_id].remove(sock)

    async def send_message_to_lobby(self, lobby: model.db.Lobby, message: str):
        """Send a string message to all players in a lobby."""
        for sock in self.lobby_sockets.get(lobby.id, []):
            if (
                sock.application_state
                == starlette.websockets.WebSocketState.CONNECTED
            ):
                await sock.send_text(message)

    async def broadcast_update(
        self, lobby: model.db.Lobby, events: list[model.db.Event] = []
    ):
        """Broadcast a new event to all players in a lobby"""
        await self.send_message_to_lobby(
            lobby, compose_update_message(lobby, events)
        )

    async def broadcast_disband(self, lobby: model.db.Lobby):
        """Broadcast a disband message to all players in a lobby."""
        await self.send_message_to_lobby(lobby, compose_kick_message())

    async def broadcast_kick(
        self, lobby: model.db.Lobby, player: model.db.Player
    ):
        """Broadcast a message to kick a specific player to an entire lobby"""
        await self.send_message_to_lobby(lobby, compose_kick_message(player))


manager = ConnectionManager()


@socketRouter.websocket("/events/{lobby_id}")
async def socket_endpoint(websocket: fastapi.WebSocket, lobby_id: str):
    # Accept the socket connection on a preliminary basis
    await websocket.accept()

    # Try to find the lobby by ID, and close the connection if not found
    lobby = await model.db.Lobby.get_by_id(model.db.ObjectId(lobby_id))
    if lobby is None:
        await websocket.close()
        return

    # Begin by sending all the current events to the client
    db = model.db.get_db()
    events = [
        model.db.Event.parse_document(e)
        for e in await db[model.db.Event.collection]
        .find({"lobby": lobby.id})
        .sort("time", 1)
        .to_list(None)
    ]
    await websocket.send_text(compose_update_message(lobby, events))

    # Then register the websocket to receive future updates
    manager.register_connection(lobby.id, websocket)

    while True:
        message = await websocket.receive()

        # Upon receiving disconnect, close the connection and return
        if message["type"] == "websocket.disconnect":
            await websocket.close()
            manager.remove_connection(lobby.id, websocket)
            break
