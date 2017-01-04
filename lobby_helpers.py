def api_success(payload=None, message=None):
    """Return a successful API response."""
    return {
        'payload': payload,
        'error': False,
        'message': message
    }


def api_error(payload=None, message=None):
    """Return an API error response, and halt execution."""
    return {
        'payload': payload,
        'error': True,
        'message': message
    }
