"""
This submodule is designed to be invoked as a script.

E.g., `python -m spgill.pos.server`
"""

# stdlib imports
import os
import pathlib

# vendor imports
import fastapi
import gevent.pywsgi
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.gzip import GZipMiddleware
import mongoengine

# local imports
from .api import apiRouter


# Define the static directory in relation to this file
staticDir = (pathlib.Path(__file__).parent / ".." / "build").resolve()
staticUrl = "/build"


# No-op function decorator
# def noop(func):
#     return func


# Initialize and configure the flask app
# def createApp():
#     app = flask.Flask(
#         __name__, static_url_path=staticUrl, static_folder=staticDir
#     )
#     app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 megabytes, fyi
#     app.config["DEBUG"] = os.environ.get("FLASK_DEBUG", "").lower() == "true"
#     app.config["SECRET_KEY"] = os.environ.get("FLASK_SECRET_KEY", "password")

#     # Connect to the database
#     app.config["MONGODB_HOST"] = os.environ.get("MONGODB_HOST", False)
#     if not app.config["MONGODB_HOST"]:
#         raise RuntimeError('Missing necessary environment "MONGODB_HOST"')
#     app.mongoConnection = flask_mongoengine.MongoEngine()
#     app.mongoConnection.init_app(app)

#     # Configure flask to use mongodb for the session backend
#     app.session_interface = flask_mongoengine.MongoEngineSessionInterface(
#         app.mongoConnection
#     )

#     # Register the API blueprint
#     app.register_blueprint(api.createBlueprint())

#     # THIS ROUTE COMES LAST
#     # Any route that doesn't go to an actual file will return the index
#     @app.route("/", defaults={"path": ""})
#     @app.route("/<path:path>")
#     def route_catchall(path):
#         return app.send_static_file("index.html")

#     # Finally, return the app
#     return app


# # Root group for all cli action
# @click.group()
# def cli():
#     pass


# # Command to dump print log entries to file (because it's hard to dump from
# # the database by hand)
# @cli.command(name="cleanup")
# def cli_cleanup():
#     # Create an app but don't start it. This initializes the mongo connection
#     createApp()
#     raise RuntimeError('Command "cleanup" is not yet implemented')


# # Command to start the server
# @cli.command(name="start")
# @click.option(
#     "--host", "-h", "hostName", type=str, default="0.0.0.0", show_default=True
# )
# @click.option(
#     "--port",
#     "-p",
#     "portNumber",
#     type=int,
#     default=int(os.environ.get("PORT", 5000)),
#     show_default=True,
# )
# def cli_start(hostName, portNumber):
#     # Create the app
#     app = createApp()

#     print(f"Starting web server on http://localhost:{portNumber}")

#     # If debug is enabled, wrap the app in the werkzeug debugger
#     appDebug = app.config["DEBUG"]
#     if appDebug:
#         print("Starting in DEBUG mode")
#         app = DebuggedApplication(app.wsgi_app, evalex=True)

#     # appDecorator = run_with_reloader if appDebug else noop

#     # Start the server
#     @appDecorator
#     def runServer():
#         gevent.pywsgi.WSGIServer(
#             listener=(hostName, portNumber), application=app
#         ).serve_forever()

#     runServer()


# # If main, execute the cli
# if __name__ == "__main__":
#     cli()


# Create the FastAPI application
app = fastapi.FastAPI()

# GZip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=256)

# Add session middleware
app.add_middleware(
    SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET_KEY", "42")
)

# Attach the API routes
app.include_router(apiRouter)


# On startup, connect to mongo database
@app.on_event("startup")
def app_startup():
    mongodbUrl = os.environ.get("MONGODB_HOST", None)
    if not mongodbUrl:
        raise RuntimeError(
            "Please specify MongoDB host via 'MONGODB_HOST' environment var"
        )

    print("Connecting to MongoDB...")
    mongoengine.connect(host=mongodbUrl)
    print("Done")


# On shutdown, close mongo connection
@app.on_event("shutdown")
def app_shutdown():
    print("Disconnecting from MongoDB...")
    mongoengine.disconnect_all()
    print("Done")
