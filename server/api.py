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
        lobbyCode = None

        # If there's a lobby ID stored in the session try looking it up
        if flask.session["lobbyId"]:
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
                lobbyCode = lobbyDocument.code

        # Return all the data in msgpack format
        return helpers.composeResponse({"lobby": lobbyCode})

    # Return the finished blueprint
    return blueprint
