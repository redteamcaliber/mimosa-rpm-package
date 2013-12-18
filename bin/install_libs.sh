#!/bin/sh

# Install the required node libraries.

. /opt/web/apps/uac/bin/env.sh

npm install $1 $2
