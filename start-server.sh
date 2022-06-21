#! /bin/sh

hypercorn server:app --bind 0.0.0.0:${PORT} "$@"
