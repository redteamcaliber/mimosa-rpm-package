#!/bin/sh

if [ -z "$1" ]; then
    echo "SAFETY parameter is not set."
    exit 1
fi

PATH=$PATH:/opt/node/node-v0.10.15-linux-x64/bin/
OPTIONS='-o'

uglifyjs $OPTIONS static/datatables/js/dataTables.boostrap.js static/datatables/js/dataTables.boostrap.js

uglifyjs $OPTIONS static/sf/js/acquisitions.js static/sf/js/acquisitions.js
uglifyjs $OPTIONS static/sf/js/components.js static/sf/js/components.js
uglifyjs $OPTIONS static/sf/js/hits.js static/sf/js/hits.js
uglifyjs $OPTIONS static/sf/js/hits-by-tag.js static/sf/js/hits-by-tag.js
uglifyjs $OPTIONS static/sf/js/hosts.js static/sf/js/hosts.js
uglifyjs $OPTIONS static/sf/js/models.js static/sf/js/models.js
uglifyjs $OPTIONS static/sf/js/shopping.js static/sf/js/shopping.js
uglifyjs $OPTIONS static/sf/js/suppressions.js static/sf/js/suppressions.js
uglifyjs $OPTIONS static/sf/js/tasks.js static/sf/js/tasks.js
uglifyjs $OPTIONS static/sf/js/utils.js static/sf/js/utils.js

uglifyjs $OPTIONS static/js/jquery.iocViewer.js static/js/jquery.iocViewer.js