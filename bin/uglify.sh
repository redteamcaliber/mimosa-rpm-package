#!/bin/sh

if [ -z "$1" ]; then
    echo "SAFETY parameter is not set."
    exit 1
fi

PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

uglifyjs -o static/sf/js/sf-models.js static/sf/js/sf-models.js
uglifyjs -o static/sf/js/sf-views.js static/sf/js/sf-views.js
uglifyjs -o static/sf/js/sf-utils.js static/sf/js/sf-utils.js