#!/bin/sh

# Run the server in debug mode restarting anytime a relevant change has been made.

. /opt/web/apps/uac/bin/env.sh

# Set the development mode configuration.
export NODE_ENV=dev
export NODE_PATH=static/server/js

# The relevant file extensions.
EXTENSIONS=js,html,json,sh

# The directories to scan.
DIRECTORIES=.,bin,conf,static/server/js,views,test

IGNORED=static/client,views/sf/templates,views/nt/templates

supervisor -e ${EXTENSIONS} -w ${DIRECTORIES} -i ${IGNORED} uac-server.js