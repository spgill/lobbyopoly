def api_success(data=None, message=None):
    """Return a successful API response."""
    return {
        'payload': data,
        'error': False,
        'message': message
    }


def api_error(data=None, message=None):
    """Return an API error response, and halt execution."""
    return {
        'payload': data,
        'error': True,
        'message': message
    }
