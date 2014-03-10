#!/bin/sh

# Run the server in debug mode restarting anytime a relevant change has been made.

. /opt/web/apps/uac/bin/env.sh

# Set the development mode configuration.
export NODE_ENV=development
export NODE_PATH=lib

mocha --reporter spec --colors --require should --compilers coffee:coffee-script/register --timeout 5000 -u bdd $1 $2 $3 $4 $5

echo

