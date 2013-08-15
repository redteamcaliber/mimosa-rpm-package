#!/bin/sh

# Run the server in debug mode restarting anytime a relevant change has been made.

# Add the node bin directory to the PATH.
PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

# Set the development mode configuration.
export NODE_ENV=production
export NODE_PATH=lib

# The node executable.
NODE=node

# The server.
SERVER=uac.js

echo "Starting server $SERVER in debug mode..."
$NODE $SERVER

