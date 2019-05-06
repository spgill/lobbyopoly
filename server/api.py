# vendor imports
import flask


def createBlueprint():

    # Create the blueprint
    blueprint = flask.Blueprint("api", __name__)

    @blueprint.route("/test")
    def blueprint_test():
        return "Hello, World!"

    # Return the finished blueprint
    return blueprint
