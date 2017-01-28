# Import builtin packages
import datetime
import os

# Import third party packages
import mongoengine as me

# Import local modules
import lobby_schema as schema


# This file is designed to be executed as a singular script
if __name__ == '__main__':

    # Get the mongodb URI and connect
    uri = os.environ.get('MONGODB_URI', None)
    if not uri:
        print('NO MONGODB URI IN ENVIRONMENT')
        exit()
    me.connect(host=uri)

    # Determine the current time
    now = datetime.datetime.utcnow()

    # Iterate through the available Lobby objects
    for lob in schema.Lobby.objects:

        # If the expiration datetime is before now, it's expired, so delete it
        if lob.expires < now:
            print(f'{lob.code} has expired')
