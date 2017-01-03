import os

import flask
from flask_socketio import SocketIO, send, emit

# Initialize the app
app = flask.Flask(__name__, static_folder='public', static_url_path='')
app.config['DEBUG'] = os.environ.get('DEBUG', False) == 'True'
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2 megabytes, fyi

# Initialize SocketIO
socket = SocketIO(app)


# Index redirect
@app.route('/')
def index_redirect():
    return flask.redirect('/html/index.html')
