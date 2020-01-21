# stdlib imports
import datetime
import enum
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


playerNameBlacklist = [
    "player",
    "themself",
    "themselves",
    "the bank",
    "bank",
    "banker",
    "the",
    "free parking",
    "free",
    "parking",
]


class TransferEntity(enum.Enum):
    SELF = "__self__"
    BANK = "__bank__"
    FP = "__fp__"

transferEntityMap = {mem.name: mem.value for mem in TransferEntity}


transferEntityStrings = {
    TransferEntity.SELF: strings.Common.TRANSFER_SELF,
    TransferEntity.BANK: strings.Common.TRANSFER_BANK,
    TransferEntity.FP: strings.Common.TRANSFER_FP,
}


def decodeTransferEntity(entity):
    try:
        return TransferEntity(entity)
    except ValueError:
        return entity


def commonInsert(member):
    return ["common", member.name]


def playerInsert(playerId):
    return ["player", playerId]


def randomCode(n=4):
    # "ACDEFGHKMNPQRTWXY34679"
    return "".join(random.sample("1234567890", n))


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
            "apiErrorMap": strings.apiErrorMap,
            "commonMap": strings.commonMap,
            "transferEntityMap": transferEntityMap,
            "playerId": None,
        }

        # If there's a lobby ID stored in the session try looking it up
        if "lobbyId" in flask.session:
            lobbyDocument = None
            try:
                lobbyDocument = model.Lobby.objects.get(
                    id=flask.session["lobbyId"]
                )

            # If the lobby doesn't exist, zero out the session
            except mongoengine.DoesNotExist:
                flask.session.clear()

            if lobbyDocument:

                # If the lobby is expired, zero out the session
                if lobbyDocument.hasExpired():
                    flask.session.clear()

                # Else, make sure the user is actually in the lobby.
                else:
                    try:
                        lobbyDocument.players.get(
                            id=flask.session.get("playerId", None)
                        )

                        # If all is good, just return the player's ID
                        data["playerId"] = flask.session["playerId"]

                    # If not, zero out the session
                    except mongoengine.DoesNotExist:
                        flask.session.clear()

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
        if data["name"].lower() in playerNameBlacklist:
            return helpers.composeError(strings.ApiError.PLY_NAME_BLACKLIST)

        # If a code was given,
        # check the code to make sure that the lobby actually exists
        if lobbyCode:
            try:
                lobby = model.Lobby.objects.get(
                    code=lobbyCode, expires__gt=now
                )
            except mongoengine.DoesNotExist:
                return helpers.composeError(
                    strings.ApiError.LOBBY_CODE_INVALID
                )

        # If no code was given, let's create a new lobby
        else:
            # Try generating codes until one is found that is unique among
            # un-expired lobby sessions
            while True:
                lobbyCode = randomCode()
                try:
                    model.Lobby.objects.get(code=lobbyCode, expires__gt=now)
                except mongoengine.DoesNotExist:
                    break

            # Now that we have a unique code, let's create a new lobby
            lobby = model.Lobby(
                code=lobbyCode,
                created=now,
                expires=now + datetime.timedelta(hours=24),
                eventHash=None,
                players=[],
                banker=None,
                bank=15140,
                freeParking=0,
            )
            lobby.save()

        # Double check there's enough room (maximum of 8 players)
        if len(lobby.players) >= 8:
            return helpers.composeError(strings.ApiError.LOBBY_FULL)

        # It's been found (or made), so let's create the player document
        # and attach it to the lobby. Also, subtract the player's starting
        # balance from the bank.
        player = model.Player(name=data.get("name", "UNKNOWN"), balance=1500)
        lobby.players.append(player)
        lobby.bank -= player.balance

        # Log an event announcing the player has joined the game
        joinEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Common.EVENT_PLY_JOIN,
            inserts=[playerInsert(player.id)],
        )
        joinEvent.save()

        # The first player to join the lobby gets made the banker
        if len(lobby.players) == 1:
            lobby.banker = player.id
            bankerEvent = model.Event(
                lobby=lobby,
                time=datetime.datetime.utcnow(),
                key=strings.Common.EVENT_PLY_MADE_BANKER,
                inserts=[playerInsert(player.id)],
            )
            bankerEvent.save()

        # Log an event showing the initial transfer of money to the player
        transferEvent = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Common.EVENT_BANK_TRANSFER_START,
            inserts=[f"${player.balance}", playerInsert(player.id)],
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
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError(strings.ApiError.SESSION_INVALID)

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(
                id=lobbyId, expires__gt=datetime.datetime.utcnow()
            )
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.LOBBY_INVALID)

        # Check that it hasn't expired
        if lobby.hasExpired():
            return helpers.composeError(strings.ApiError.LOBBY_EXPIRED)

        # Double check that the player is still in the game
        try:
            lobby.players.get(id=flask.session["playerId"])
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.PLY_NOT_ACTIVE)

        # Return all the lobby data
        return helpers.composeResponse(lobby.to_mongo().to_dict())

    @blueprint.route("/api/transfer", methods=["POST"])
    def api_transfer():
        """API method to transfer funds from one account to another."""
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError(strings.ApiError.SESSION_INVALID)

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(
                id=lobbyId, expires__gt=datetime.datetime.utcnow()
            )
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.LOBBY_INVALID)

        # Fetch the player from the lobby document
        player = lobby.players.get(id=flask.session["playerId"])

        # Parse and extract the data sent by the client
        data = helpers.parseRequestData()
        source = decodeTransferEntity(data["source"])
        destination = decodeTransferEntity(data["destination"])
        amount = decodeTransferEntity(data["amount"])

        # First, make sure that the player has permission
        # If the source is anything besides the current player, then the
        # current player must be the banker.
        if source is not TransferEntity.SELF and player.id != lobby.banker:
            return helpers.composeError(strings.ApiError.PLY_NOT_BANKER)

        # First, make sure the debited party has enough funds
        sufficient = None
        if source is TransferEntity.SELF:
            sufficient = player.balance >= amount
        elif source is TransferEntity.BANK:
            sufficient = lobby.bank >= amount
        elif source is TransferEntity.FP:
            sufficient = lobby.freeParking >= amount
        else:
            return helpers.composeError(strings.ApiError.TRANSFER_INVALID_SRC)

        if not sufficient:
            return helpers.composeError(strings.ApiError.TRANSFER_FUNDS)

        # Now, deduct that amount from the debited party
        if source is TransferEntity.SELF:
            player.balance -= amount
        elif source is TransferEntity.BANK:
            lobby.bank -= amount
        elif source is TransferEntity.FP:
            lobby.freeParking -= amount

        # Next, add the amount to the credited party
        if destination is TransferEntity.SELF:
            player.balance += amount
        elif destination is TransferEntity.BANK:
            lobby.bank += amount
        elif destination is TransferEntity.FP:
            lobby.freeParking += amount
        else:
            try:
                destinationPlayer = lobby.players.get(id=destination)
                destinationPlayer.balance += amount
            except mongoengine.DoesNotExist:
                return helpers.composeError(
                    strings.ApiError.TRANSFER_INVALID_DEST
                )

        print(dir(lobby.players))
        print(player.id, player.name)
        print(dir(player))

        sourceInsert = commonInsert(transferEntityStrings[source])

        destinationInsert = (
            commonInsert(transferEntityStrings[destination])
            if isinstance(destination, TransferEntity)
            else playerInsert(destination)
        )

        # Almost there, we just gotta log the transfer
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Common.EVENT_TRANSFER,
            inserts=[
                playerInsert(player.id),
                f"${amount}",
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
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError(strings.ApiError.SESSION_INVALID)

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(
                id=lobbyId, expires__gt=datetime.datetime.utcnow()
            )
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.LOBBY_INVALID)

        # Fetch the player from the lobby document
        player = lobby.players.get(id=flask.session["playerId"])

        # Make sure the current player is the banker
        if player.id != lobby.banker:
            return helpers.composeError(strings.ApiError.PLY_NOT_BANKER)

        # Parse the request data
        data = helpers.parseRequestData()
        target = data["target"]

        # Log the transfer of power
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Common.EVENT_PLY_TRANSFER_BANKER,
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
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError(strings.ApiError.SESSION_INVALID)

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(
                id=lobbyId, expires__gt=datetime.datetime.utcnow()
            )
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.LOBBY_INVALID)

        # Fetch the player from the lobby document
        player = lobby.players.get(id=flask.session["playerId"])

        # If the player is the banker, don't allow them to leave
        if player.id == lobby.banker:
            return helpers.composeError(strings.ApiError.BANKER_CANNOT_LEAVE)

        # Transfer the player's balance back to the bank
        lobby.bank += player.balance

        # Remove the player from the lobby
        lobby.players.remove(player)

        # Log the event and save changes
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Common.EVENT_PLY_LEAVE,
        )
        event.save()
        updateEventHash(lobby, event)
        lobby.save()

        return helpers.composeResponse(True)

    @blueprint.route("/api/kick", methods=["POST"])
    def api_kick():
        """
        API method for current player to leave lobby
        """
        # Fetch the lobby id from the session
        lobbyId = flask.session.get("lobbyId", None)
        if not lobbyId:
            return helpers.composeError(strings.ApiError.SESSION_INVALID)

        # Try to locate the lobby in the database
        try:
            lobby = model.Lobby.objects.get(
                id=lobbyId, expires__gt=datetime.datetime.utcnow()
            )
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.LOBBY_INVALID)

        # Fetch the player from the lobby document
        player = lobby.players.get(id=flask.session["playerId"])

        # Make sure the current player is the banker
        if player.id != lobby.banker:
            return helpers.composeError(strings.ApiError.PLY_NOT_BANKER)

        # Parse the request data and find the target player
        data = helpers.parseRequestData()
        try:
            target = lobby.players.get(id=data["target"])
        except mongoengine.DoesNotExist:
            return helpers.composeError(strings.ApiError.KICK_NOT_FOUND)

        # Make sure the target isn't themselves
        if target.id == player.id:
            return helpers.composeError(strings.ApiError.KICK_YOURSELF)

        # Transfer the target's balance back to the bank
        lobby.bank += target.balance

        # Remove the target player from the lobby
        lobby.player.remove(target)

        # Log the event and save changes
        event = model.Event(
            lobby=lobby,
            time=datetime.datetime.utcnow(),
            key=strings.Common.EVENT_PLY_KICK,
        )
        event.save()
        updateEventHash(lobby, event)
        lobby.save()

        return helpers.composeResponse(True)

    # Return the finished blueprint
    return blueprint
