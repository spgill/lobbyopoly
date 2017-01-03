#! /usr/bin/python3
"""
Basically just a wrapper that loads the main flask up and
runs it under a Tornado server, to provide better performance than
the builtin development server.
"""
# Fix annoying Python 3.6 issue
import socketserver
class null(object):
    pass
socketserver.ForkingMixIn = null

import os

from monopoly_server import app, socket


def main():
    """Start the web server."""
    host = '0.0.0.0'
    port = int(os.environ.get("PORT", 5000))

    if app.config['DEBUG']:
        print('DEBUGMODE')
        socket.run(
            app=app,
            host=host,
            port=port,
            debug=True,
            use_reloader=True,
            log_output=True
        )

    else:
        socket.run(
            app=app,
            host=host,
            port=port,
            debug=False,
            use_reloader=False,
            log_output=False
        )


if __name__ == "__main__":
    main()
