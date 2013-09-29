#!/bin/sh

if [ -z "$1" ]; then
    echo "SAFETY parameter is not set."
    exit 1
fi

PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/

uglifyjs -o static/sf/js/acquisitions.js static/sf/js/acquisitions.js
uglifyjs -o static/sf/js/components.js static/sf/js/components.js
uglifyjs -o static/sf/js/hits.js static/sf/js/hits.js
uglifyjs -o static/sf/js/hits-by-tag.js static/sf/js/hits-by-tag.js
uglifyjs -o static/sf/js/hosts.js static/sf/js/hosts.js
uglifyjs -o static/sf/js/models.js static/sf/js/models.js
uglifyjs -o static/sf/js/shopping.js static/sf/js/shopping.js
uglifyjs -o static/sf/js/suppressions.js static/sf/js/suppressions.js
uglifyjs -o static/sf/js/tasks.js static/sf/js/tasks.js
uglifyjs -o static/sf/js/utils.js static/sf/js/utils.js

uglifyjs -o static/js/jquery.iocViewer.js static/js/jquery.iocViewer.js