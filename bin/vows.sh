#!/bin/sh

# Run a vows unit test.

# Add the node bin directory to the PATH.
PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

# Set the development mode configuration.
export NODE_ENV=development
export NODE_PATH=lib

if [ $2 ]; then
    # Run a specific test.
    vows --spec $1 -m $2
else
    # Run all tests.
    vows --spec $1
fi

echo

