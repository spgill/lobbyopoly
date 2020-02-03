# stdlib imports
import datetime
import hashlib
import random

# vendor imports
import flask
import mongoengine

# local imports
import helpers
import strings
import model


def updateEventHash(lobby, event):
    initial = lobby.eventHash if lobby.eventHash else "INITIAL"
    hasher = hashlib.blake2b(initial.encode("utf8"))
    hasher.update(event.id.binary)
    lobby.eventHash = hasher.hexdigest()[:24]


def verifySessionLobby():
    # Fetch the lobby id from the session
    lobbyId = flask.session.get("lobbyId", None)
    if not lobbyId:
        return (strings.Bundle.ERROR_SESSION_INVALID, None, None)

    # Try to locate the lobby in the database
    try:
        lobby = model.Lobby.objects.get(
            id=lobbyId, expires__gt=datetime.datetime.utcnow(), disbanded=False
        )
    except mongoengine.DoesNotExist:
        return (strings.Bundle.ERROR_LOBBY_INVALID, None, None)

    # Fetch the player from the lobby document
    try:
        player = lobby.players.get(id=flask.session["playerId"])
    except mongoengine.DoesNotExist:
        return (strings.Bundle.ERROR_PLY_NOT_ACTIVE, None, None)

    return (None, lobby, player)


transferEntityStrings = {
    strings.TransferEntity.SELF: strings.Bundle.TRANSFER_SELF,
    strings.TransferEntity.BANK: strings.Bundle.TRANSFER_BANK,
    strings.TransferEntity.FP: strings.Bundle.TRANSFER_FP,
}


def decodeTransferEntity(entity):
    try:
        return strings.TransferEntity(entity)
    except ValueError:
        return entity


def bundleInsert(member):
    return ["bundle", member.name]


def playerInsert(playerId):
    return ["player", playerId]


def currencyInsert(amount):
    return ["currency", amount]


def randomCode(n=4):
    # "ACDEFGHKMNPQRTWXY34679"
    return "".join(random.sample("1234567890", n))


def verifyGameOptions(options):
    # First, make sure all of the options are there
    for name in [
        "unlimitedBank",
        "freeParking",
        "maxPlayers",
        "bankBalance",
        "startingBalance",
        "currency",
    ]:
        if name not in options:
            return strings.Bundle.ERROR_INVALID_OPTIONS

    # Verify all numbers are number and are not negative
    for name in [
        "maxPlayers",
        "bankBalance",
        "startingBalance",
    ]:
        if not isinstance(options[name], int) or options[name] < 0:
            return strings.Bundle.ERROR_INVALID_OPTIONS

    # Verify number of max players is in range
    if options["maxPlayers"] < 2 or options["maxPlayers"] > 50:
        return strings.Bundle.ERROR_INVALID_OPTIONS

    # Make sure the starting balance is less than the bank balance
    if (
        not options["unlimitedBank"]
        and options["startingBalance"] >= options["bankBalance"]
    ):
        return strings.Bundle.ERROR_INVALID_OPTIONS

    # Make sure the currency option is valid
    if options["currency"] not in ["$", "£"]:
        return strings.Bundle.ERROR_INVALID_OPTIONS

    return None


def createBlueprint():  # noqa: C901
    # Create the blueprint
    blueprint = flask.Blueprint("api", __name__)

    @blueprint.route("/api/preflight", methods=["GET"])
    def api_preflight():
        """
        API checked by clients on page load.

        Currently just returns whether or not the user is in an active session.
        """

        # Create the basic data structure to return
        data = {
            "bundleMap": strings.bundleMap,
            "transferEntityMap": strings.transferEntityMap,
            "playerId": None,
        }

        # Verify session info, and if there are errors, wipe the session
        (error, lobby, player) = verifySessionLobby()
        if error:
            flask.session.clear()
        else:
            data["playerId"] = flask.session["playerId"]

        # If it gets here, just return nothing
        return helpers.composeResponse(data)

    @blueprint.route("/api/join", methods=["POST"])
    def api_join():
        """
        API for a user to join a lobby, by its code.

        Alternatively, can create a new lobby.
        """
        now = datetime.datetime.utcnow()
        data = helpers.parseRequestData()
        lobbyCode = data.get("code", None)

        # First things first, make sure the player name is not on the list
        if data["name"].lower() in strings.playerNameBlacklist:
            return helpers.composeError(
                strings.Bundle.ERROR_PLY_NAME_BLACKLIST
            )

        # If a code was given,
        # check the code to make sure that the lobby actually exists
        if lobbyCode:
            try:
                lobby = model.Lobby.objects.get(
                    code=lobbyCode, expires__gt=now, disbanded=False
                )
            except mongoengine.DoesNotExist:
                return helpers.composeError(
                    strings.Bundle.ERROR_LOBBY_CODE_INVALID
                )

        # If no code was given, let's create a new lobby
        else:
            # Try generating codes until one is found that is unique among
            # un-expired and non-disbanded lobby sessions
            while True:
                lobbyCode = randomCode()
                try:
                    model.Lobby.objects.get(
                        code=lobbyCode, expires__gt=now, disbanded=False
                    )
                except mongoengine.DoesNotExist:
                    break

            # Fetch the game options and verify them
            gameOptions = data.get("options", {})
            if (
                gameOptionsError := verifyGameOptions(gameOptions)
            ) is not None:
                return helpers.composeError(gameOptionsError)

            # Now that we have a unique code, let's create a new lobby
            lobby = model.Lobby(
                code=lobbyCode,
                created=now,
                expires=now + datetime.timedelta(hours=24),
                eventHash=None,
                disbanded=False,
                options=gameOptions,
                players=[],
                banker=None,
                bank=gameOptions["bankBalance"],
                freeParking=0,
            )
            lobby.save()

        # Double check there's enough room (maximum of 8 players)
        if len(lobby.players) >= lobby.options["maxPlayers"]:
            return helpers.composeError(strings.Bundle.ERROR_LOBBY_FULL)

        # It's been found (or made), so let's create the player document
        # and attach it to the lobby. Also, subtract the player's starting
        # balance from the bank.
        player = model.Player(
            name=data.get("name", "UNKNOWN"),
            balance=lobby.options["startingBalance"],
        )
        lobby.players.append(player)
        lobby.bank -= player.balance

        # Log an event announcing the player has joined the game
        joinEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Bundle.EVENT_PLY_JOIN,
            inserts=[playerInsert(player.id), currencyInsert(player.balance)],
        )
        joinEvent.save()

        # The first player to join the lobby gets made the banker
        if len(lobby.players) == 1:
            lobby.banker = player.id
            bankerEvent = model.Event(
                lobby=lobby,
                time=datetime.datetime.utcnow(),
                key=strings.Bundle.EVENT_PLY_MADE_BANKER,
                inserts=[playerInsert(player.id)],
            )
            bankerEvent.save()
            updateEventHash(lobby, bankerEvent)

        # else, update the event hash with the join event
        else:
            updateEventHash(lobby, joinEvent)

        # Save changes to the lobby
        lobby.save()

        # Store the lobby id and player id in the player's session
        flask.session["lobbyId"] = lobby.id
        flask.session["playerId"] = player.id

        # Return the player id to the client, indicating that they are in
        # the lobby and can start the polling process
        return helpers.composeResponse(player.id)

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
            .exclude("lobby")
            .as_pymongo()
        )
        return helpers.composeResponse(events)

    @blueprint.route("/api/poll", methods=["GET"])
    def api_poll():
        """API method to poll the lobby for concise info."""
        # Verify that the lobby and player are valid. Return any errors
        (error, lobby, player) = verifySessionLobby()
        if error:
            return helpers.composeError(error)

        # Return all the lobby data
        return helpers.composeResponse(lobby.to_mongo().to_dict())

    @blueprint.route("/api/transfer", methods=["POST"])
    def api_transfer():
        """API method to transfer funds from one account to another."""
        # Verify that the lobby and player are valid. Return any errors
        (error, lobby, player) = verifySessionLobby()
        if error:
            return helpers.composeError(error)

        # Parse and extract the data sent by the client
        data = helpers.parseRequestData()
        source = decodeTransferEntity(data["source"])
        destination = decodeTransferEntity(data["destination"])
        amount = decodeTransferEntity(data["amount"])

        # First, make sure that the player has permission
        # If the source is anything besides the current player, then the
        # current player must be the banker.
        if (
            source is not strings.TransferEntity.SELF
            and player.id != lobby.banker
        ):
            return helpers.composeError(strings.Bundle.ERROR_PLY_NOT_BANKER)

        # First, make sure the debited party has enough funds
        sufficient = None
        if source is strings.TransferEntity.SELF:
            sufficient = player.balance >= amount
        elif source is strings.TransferEntity.BANK:
            if lobby.options["unlimitedBank"]:
                sufficient = True
            else:
                sufficient = lobby.bank >= amount
        elif source is strings.TransferEntity.FP:
            sufficient = lobby.freeParking >= amount
        else:
            return helpers.composeError(
                strings.Bundle.ERROR_TRANSFER_INVALID_SRC
            )

        if not sufficient:
            return helpers.composeError(strings.Bundle.ERROR_TRANSFER_FUNDS)

        # Now, deduct that amount from the debited party
        if source is strings.TransferEntity.SELF:
            player.balance -= amount
        elif source is strings.TransferEntity.BANK:
            lobby.bank -= amount
        elif source is strings.TransferEntity.FP:
            lobby.freeParking -= amount

        # Next, add the amount to the credited party
        if destination is strings.TransferEntity.SELF:
            player.balance += amount
        elif destination is strings.TransferEntity.BANK:
            lobby.bank += amount
        elif destination is strings.TransferEntity.FP:
            lobby.freeParking += amount
        else:
            try:
                destinationPlayer = lobby.players.get(id=destination)
                destinationPlayer.balance += amount
            except mongoengine.DoesNotExist:
                return helpers.composeError(
                    strings.Bundle.ERROR_TRANSFER_INVALID_DEST
                )

        print(dir(lobby.players))
        print(player.id, player.name)
        print(dir(player))

        sourceInsert = bundleInsert(transferEntityStrings[source])

        destinationInsert = (
            bundleInsert(transferEntityStrings[destination])
            if isinstance(destination, strings.TransferEntity)
            else playerInsert(destination)
        )

        # Almost there, we just gotta log the transfer
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Bundle.EVENT_TRANSFER,
            inserts=[
                playerInsert(player.id),
                currencyInsert(amount),
                sourceInsert,
                destinationInsert,
            ],
        )
        event.save()

        # Finally, update the event hash and save all changes
        updateEventHash(lobby, event)
        lobby.save()

        # If all is well, just return True
        return helpers.composeResponse(True)

    @blueprint.route("/api/makeBanker", methods=["POST"])
    def api_makeBanker():
        """
        API method to transfer banker responsibilities from one player to another
        """
        # Verify that the lobby and player are valid. Return any errors
        (error, lobby, player) = verifySessionLobby()
        if error:
            return helpers.composeError(error)

        # Make sure the current player is the banker
        if player.id != lobby.banker:
            return helpers.composeError(strings.Bundle.ERROR_PLY_NOT_BANKER)

        # Parse the request data
        data = helpers.parseRequestData()
        target = data["target"]

        # Log the transfer of power
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Bundle.EVENT_PLY_TRANSFER_BANKER,
            inserts=[playerInsert(player.id), playerInsert(target)],
        )
        event.save()

        # Change the banker, update the event hash, and save changes
        lobby.banker = target
        updateEventHash(lobby, event)
        lobby.save()

        return helpers.composeResponse(True)

    @blueprint.route("/api/leave", methods=["GET"])
    def api_leave():
        """
        API method for current player to leave lobby
        """
        # Verify that the lobby and player are valid. Return any errors
        (error, lobby, player) = verifySessionLobby()
        if error:
            return helpers.composeError(error)

        # If the player is the banker, don't allow them to leave
        if player.id == lobby.banker:
            return helpers.composeError(
                strings.Bundle.ERROR_BANKER_CANNOT_LEAVE
            )

        # Transfer the player's balance back to the bank
        lobby.bank += player.balance

        # Remove the player from the lobby
        lobby.players.remove(player)

        # Log the event and save changes
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Bundle.EVENT_PLY_LEAVE,
        )
        event.save()
        updateEventHash(lobby, event)
        lobby.save()

        # Finally, zero out the player's session
        flask.session.clear()

        return helpers.composeResponse(True)

    @blueprint.route("/api/disband", methods=["GET"])
    def api_disband():
        """
        API method for the banker to disband the lobby
        """
        # Verify that the lobby and player are valid. Return any errors
        (error, lobby, player) = verifySessionLobby()
        if error:
            return helpers.composeError(error)

        # If the player is not the banker, return permission error
        if player.id != lobby.banker:
            return helpers.composeError(strings.Bundle.ERROR_PLY_NOT_BANKER)

        # Mark the lobby as disbanded
        lobby.disbanded = True

        # Log the event
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Bundle.EVENT_DISBANDED,
        )
        event.save()

        # Update the event hash and save lobby changes
        updateEventHash(lobby, event)
        lobby.save()

        # Return empty response
        return helpers.composeResponse()

    @blueprint.route("/api/kick", methods=["POST"])
    def api_kick():
        """
        API method for current player to leave lobby
        """
        # Verify that the lobby and player are valid. Return any errors
        (error, lobby, player) = verifySessionLobby()
        if error:
            return helpers.composeError(error)

        # Make sure the current player is the banker
        if player.id != lobby.banker:
            return helpers.composeError(strings.Bundle.ERROR_PLY_NOT_BANKER)

        # Parse the request data and find the target player
        data = helpers.parseRequestData()
        try:
            target = lobby.players.get(id=data["target"])
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.Bundle.ERROR_KICK_NOT_FOUND)

        # Make sure the target isn't themselves
        if target.id == player.id:
            return helpers.composeError(strings.Bundle.ERROR_KICK_YOURSELF)

        # Transfer the target's balance back to the bank
        lobby.bank += target.balance

        # Remove the target player from the lobby
        lobby.player.remove(target)

        # Log the event and save changes
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Bundle.EVENT_PLY_KICK,
        )
        event.save()
        updateEventHash(lobby, event)
        lobby.save()

        return helpers.composeResponse(True)

    # Return the finished blueprint
    return blueprint