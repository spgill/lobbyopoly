# stdlib imports
import datetime
import hashlib

# vendor imports
import flask
import mongoengine

# local imports
import helpers
import model


def updateLobbyHash(lobby, event):
    initial = lobby.eventHash if lobby.eventHash else 'INITIAL'
    hasher = hashlib.blake2b(initial.encode('utf8'))
    hasher.update(event.id.binary)
    lobby.eventHash = hasher.hexdigest()


def createBlueprint():

    # Create the blueprint
    blueprint = flask.Blueprint("api", __name__)

    @blueprint.route("/test")
    def blueprint_test():
        return "Hello, World!"

    @blueprint.route("/api/preflight")
    def api_preflight():
        """
        API checked by clients on page load.

        Currently just returns whether or not the user is in an active session.
        """
        lobbyId = None

        # If there's a lobby ID stored in the session try looking it up
        if "lobbyId" in flask.session:
            lobbyDocument = None
            try:
                lobbyDocument = model.Lobby.objects.get(
                    id=flask.session["lobbyId"]
                )

            # If the session doesn't exist, clear the cookie storage
            except mongoengine.DoesNotExist:
                flask.session["lobbyId"] = None

            # If a session was found, see if it has expired
            if (
                lobbyDocument
                and lobbyDocument.expires > datetime.datetime.utcnow()
            ):
                lobbyId = lobbyDocument.code

        # Return all the data in msgpack format
        return helpers.composeResponse({"lobby": lobbyId})

    @blueprint.route("/api/join")
    def api_join_code():
        """
        API for a user to join a lobby, by its code.
        """
        data = helpers.parseRequest()

        # Check the code to make sure that the lobby actually exists
        try:
            lobby = model.Lobby.objects.get(code=data.get("code", "????"))
        except mongoengine.DoesNotExist:
            return helpers.composeError("Lobby with this code does not exist")

        # It's been found, so let's create the player document
        # and attach it to the lobby. Also, subtract the player's starting
        # balance from the bank.
        player = model.Player(name=data.get("name", "UNKNOWN"), balance=1024)
        player.save()
        lobby.players.append(player)
        lobby.bank -= player.balance

        # Log an event announcing the player has joined the game
        joinEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            text=f'PLAYER<{player.id}> joined the game'
        )
        joinEvent.save()

        # Log an event showing the initial transfer of money to the player
        transferEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            text=f'The Bank transferred ${player.balance} to PLAYER<{player.id}> to get them started'
        )
        transferEvent.save()

        # Update the lobby's log hash and save changes
        updateLobbyHash(lobby, transferEvent)
        lobby.save()

        # Store the player id in the player's session
        flask.session["player"] = player.id

        return helpers.composeResponse(True)

    # Return the finished blueprint
    return blueprint
