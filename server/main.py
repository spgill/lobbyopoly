# stdlib imports
import os
import pathlib

# vendor imports
import fastapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.gzip import GZipMiddleware
import mongoengine

# local imports
from .api import apiRouter


# Create the FastAPI application
app = fastapi.FastAPI()

# GZip compression middleware
app.add_middleware(GZipMiddleware, minimum_size=256)

# Add session middleware
app.add_middleware(
    SessionMiddleware, secret_key=os.environ.get("SESSION_SECRET_KEY", "42")
)

# Mount static file server for UI build
staticDir = (pathlib.Path(__file__).parent / ".." / "build").resolve()
staticUrl = "/build"
app.mount(staticUrl, StaticFiles(directory=staticDir), "static")

# Attach the API routes
app.include_router(apiRouter)

# Default route redirect to build
@app.get("/")
def app_default():
    return RedirectResponse("/build/index.html")


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
