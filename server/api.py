# stdlib imports
import datetime

# vendor imports
import flask
import mongoengine

# local imports
import helpers
import model


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
        print("DATA RECEIVED", data)

        flask.session["test"] = "lol"

        return helpers.composeResponse(True)

    # Return the finished blueprint
    return blueprint
