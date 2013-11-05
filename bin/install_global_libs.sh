#!/bin/sh

# Install the required development global node libraries.

# Add the node bin directory to the PATH.
PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

npm install supervisor -g
npm install mocha@"~1.13.0" -g
npm install uglify-js -g
