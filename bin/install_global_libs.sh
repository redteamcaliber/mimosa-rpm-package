#!/bin/sh

# Install the required development global node libraries.

. /opt/web/apps/uac/bin/env.sh

npm install -g grunt-cli
npm install -g supervisor
npm install -g mocha
npm install -g redis-commander
npm install -g coffee-script
npm install -g bower