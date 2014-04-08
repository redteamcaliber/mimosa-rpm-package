#!/bin/sh

# Run the server in debug mode restarting anytime a relevant change has been made.

. /opt/web/apps/uac/bin/env.sh

# Set the development mode configuration.
export NODE_ENV=dev
export NODE_PATH=dist/server/js

# The relevant file extensions.
EXTENSIONS=js,html,json,sh

# The directories to scan.
DIRECTORIES=bin,conf,dist/server

IGNORED=

supervisor -e ${EXTENSIONS} -w ${DIRECTORIES} uac-server.js