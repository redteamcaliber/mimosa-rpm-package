#!/bin/sh

# Run the server in debug mode restarting anytime a relevant change has been made.

# Add the node bin directory to the PATH.
PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

# Set the development mode configuration.
export NODE_ENV=development
export NODE_PATH=lib

mocha --reporter spec --colors --timeout 5000 -u bdd $1 $2 $3 $4 $5

echo

