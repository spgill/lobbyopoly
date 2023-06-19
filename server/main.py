# stdlib imports
import os
import pathlib

# vendor imports
import fastapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.gzip import GZipMiddleware

# local imports
from .api import apiRouter
from .socket import socketRouter
from .model.db import connect_and_init_db, close_db_connect

# Create the FastAPI application
app = fastapi.FastAPI()

# Database connection events
app.add_event_handler("startup", connect_and_init_db)
app.add_event_handler("shutdown", close_db_connect)

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
app.include_router(socketRouter)


# Default route redirect to build
@app.get("/")
def app_default():
    return RedirectResponse("/build/index.html")
