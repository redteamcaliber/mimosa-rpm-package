#!/bin/sh

# Run the server in debug mode restarting anytime a relevant change has been made.

. /opt/web/apps/uac/bin/env.sh

# Set the development mode configuration.
export NODE_ENV=development
export NODE_PATH=lib

# The relevant file extensions.
EXTENSIONS=js,html,json

# The directories to scan.
DIRECTORIES=.,conf,lib,static,views


supervisor -e $EXTENSIONS -w $DIRECTORIES uac.js

