# stdlib imports
import datetime
import hashlib

# vendor imports
import flask
import mongoengine

# local imports
import helpers
import model


def updateEventHash(lobby, event):
    initial = lobby.eventHash if lobby.eventHash else "INITIAL"
    hasher = hashlib.blake2b(initial.encode("utf8"))
    hasher.update(event.id.binary)
    lobby.eventHash = hasher.hexdigest()


transferInserts = {
    "__me__": "themselves",
    "__bank__": "The Bank",
    "__freeParking__": "Free Parking",
}


def playerInsert(playerId):
    return f"PLAYER<{playerId}>"


def createBlueprint():

    # Create the blueprint
    blueprint = flask.Blueprint("api", __name__)

    @blueprint.route("/api/preflight", methods=["GET"])
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

    @blueprint.route("/api/join", methods=["POST"])
    def api_join_code():
        """
        API for a user to join a lobby, by its code.
        """
        data = helpers.parseRequestData()

        # Check the code to make sure that the lobby actually exists
        try:
            lobby = model.Lobby.objects.get(code=data.get("code", "????"))
        except mongoengine.DoesNotExist:
            return helpers.composeError("Lobby with this code does not exist")

        # It's been found, so let's create the player document
        # and attach it to the lobby. Also, subtract the player's starting
        # balance from the bank.
        player = model.Player(name=data.get("name", "UNKNOWN"), balance=1024)
        lobby.players.append(player)
        lobby.bank -= player.balance

        # Log an event announcing the player has joined the game
        joinEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            text=f"{playerInsert(player.id)} joined the game",
        )
        joinEvent.save()

        # The first player to join the lobby gets made the banker
        if len(lobby.players) == 1:
            lobby.banker = player.id
            bankerEvent = model.Event(
                lobby=lobby,
                time=datetime.datetime.utcnow(),
                text=f"{playerInsert(player.id)} has been made The Banker",
            )
            bankerEvent.save()

        # Log an event showing the initial transfer of money to the player
        transferEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            text=f"The Bank transferred ${player.balance} to {playerInsert(player.id)} to get them started",
        )
        transferEvent.save()

        # Update the lobby's log hash and save changes
        updateEventHash(lobby, transferEvent)
        lobby.save()

        # Store the lobby id and player id in the player's session
        flask.session["lobbyId"] = lobby.id
        flask.session["playerId"] = player.id

        # Return the player id to the client, indicating that they are in
        # the lobby and can start the polling process
        return helpers.composeResponse(str(player.id))

    @blueprint.route("/api/events", methods=["GET"])
    def api_events():
        """API to fetch an array of events for a lobby."""
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeResponse([])

        # Now, return the array of events; sorted by time
        events = list(
            model.Event.objects(lobby=lobbyId)
            .order_by("-time")
            .only("time", "text")
            .as_pymongo()
        )
        return helpers.composeResponse(events)

    @blueprint.route("/api/poll", methods=["GET"])
    def api_poll():
        """API method to poll the lobby for concise info."""
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError("Session info error!")

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(id=lobbyId)
        except mongoengine.DoesNotExist:
            return helpers.composeError("Invalid lobby")

        # Check that it hasn't expired
        if lobby.hasExpired():
            return helpers.composeError("Lobby has expired")

        # Return all the lobby data
        return helpers.composeResponse(lobby.to_mongo().to_dict())

    @blueprint.route("/api/transfer", methods=["POST"])
    def api_transfer():
        """API method to transfer funds from one account to another."""
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError("Session info error!")

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(id=lobbyId)
        except mongoengine.DoesNotExist:
            return helpers.composeError("Invalid lobby")

        # Fetch the player from the lobby document
        player = lobby.players.get(id=flask.session["playerId"])
        print("PLAYER", player.name, dir(player))

        # Parse and extract the data sent by the client
        data = helpers.parseRequestData()
        source = data["source"]
        destination = data["destination"]
        amount = data["amount"]

        # First, make sure that the player has permission
        # If the source is anything besides the current player, then the
        # current player must be the banker.
        if source != "__me__" and player.id != lobby.banker:
            return helpers.composeError("You are not the banker")

        # First, make sure the debited party has enough funds
        sufficient = None
        if source == "__me__":
            sufficient = player.balance >= amount
        elif source == "__bank__":
            sufficient = lobby.bank >= amount
        elif source == "__freeParking__":
            sufficient = lobby.freeParking >= amount
        else:
            return helpers.composeError("Invalid transfer source")

        # Now, deduct that amount from the debited party
        if source == "__me__":
            player.balance -= amount
        elif source == "__bank__":
            lobby.bank -= amount
        elif source == "__freeParking__":
            lobby.freeParking -= amount

        # Next, add the amount to the credited party
        if destination == "__me__":
            player.balance += amount
        elif destination == "__bank__":
            lobby.bank += amount
        elif destination == "__freeParking__":
            lobby.freeParking += amount
        else:
            try:
                destinationPlayer = lobby.players.get(id=destination)
                destinationPlayer.balance += amount
            except mongoengine.DoesNotExist:
                return helpers.composeError("Invalid transfer destination")

        # Almost there, we just gotta log the transfer
        sourceInsert = transferInserts[source]
        destinationInsert = (
            transferInserts[destination]
            if destination in transferInserts
            else playerInsert(destination)
        )
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            text=f"{playerInsert(player.id)} transferred ${amount} from {sourceInsert} to {destinationInsert}",
        )
        event.save()

        # Update the event hash and save all changes
        updateEventHash(lobby, event)
        lobby.save()

        # If all is well, just return True
        return helpers.composeResponse(True)

    # Return the finished blueprint
    return blueprint
