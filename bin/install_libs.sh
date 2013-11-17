#!/bin/sh

# Install the required node libraries.

# Add the node bin directory to the PATH.
PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

npm install $1 $2


