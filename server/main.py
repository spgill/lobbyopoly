"""
This submodule is designed to be invoked as a script.

E.g., `python -m spgill.pos.server`
"""

# stdlib imports
import os
import pathlib

# vendor imports
import click
import flask
import flask_mongoengine
import gevent.pywsgi
from werkzeug.serving import run_with_reloader
from werkzeug.debug import DebuggedApplication

# local imports
import api


# No-op function decorator
def noop(func):
    return func


# Initialize and configure the flask app
def createApp():
    app = flask.Flask(__name__, static_folder=None)
    app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 megabytes, fyi
    app.config["DEBUG"] = os.environ.get("FLASK_DEBUG", "").lower() == "true"
    app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "password")

    # Connect to the database
    app.config["MONGODB_HOST"] = os.environ.get("MONGODB_HOST", False)
    if not app.config["MONGODB_HOST"]:
        raise RuntimeError('Missing necessary environment "MONGODB_HOST"')
    app.mongoConnection = flask_mongoengine.MongoEngine()
    app.mongoConnection.init_app(app)

    # Configure flask to use mongodb for the session backend
    app.session_interface = flask_mongoengine.MongoEngineSessionInterface(
        app.mongoConnection
    )

    # Register the API blueprint
    app.register_blueprint(api.createBlueprint())

    # THIS ROUTE COMES LAST
    # Any route that doesn't go to an actual file will return the index
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def route_index_wildcard(path):
        filepath = pathlib.Path(flask.safe_join("../build", path))
        if filepath.exists() and filepath.is_file():
            return flask.send_file(str(filepath))
        elif filepath.suffix:
            return flask.abort(404)
        return flask.send_file("../build/index.html")

    # Finally, return the app
    return app


# Root group for all cli action
@click.group()
def cli():
    pass


# Command to dump print log entries to file (because it's hard to dump from
# the database by hand)
@cli.command(name="cleanup")
def cli_cleanup():
    # Create an app but don't start it. This initializes the mongo connection
    createApp()
    raise RuntimeError('Command "cleanup" is not yet implemented')


# Command to start the server
@cli.command(name="start")
@click.option(
    "--host", "-h", "hostName", type=str, default="0.0.0.0", show_default=True
)
@click.option(
    "--port",
    "-p",
    "portNumber",
    type=int,
    default=int(os.environ.get("PORT", 5000)),
    show_default=True,
)
def cli_start(hostName, portNumber):
    # Create the app
    app = createApp()

    print(f"Starting web server on http://localhost:{portNumber}")

    # If debug is enabled, wrap the app in the werkzeug debugger
    appDebug = app.config["DEBUG"]
    if appDebug:
        print("Starting in DEBUG mode")
        app = DebuggedApplication(app.wsgi_app, evalex=True)

    appDecorator = run_with_reloader if appDebug else noop

    # Start the server
    @appDecorator
    def runServer():
        gevent.pywsgi.WSGIServer(
            listener=(hostName, portNumber), application=app
        ).serve_forever()

    runServer()


# If main, execute the cli
if __name__ == "__main__":
    cli()
