UAC Web Application Development Installation Documentation
==============================================

Install the nginx Web Server
----------------------------

### Add a nginx yum repository.  Edit the following file: /etc/yum.repos.d/nginx.repo

    [nginx]
    name=nginx repo
    baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
    gpgcheck=0
    enabled=1

### Install the server:

    $ yum install nginx.x86_64
    $ chkconfig nginx on
    $ chkconfig nginx start

### Configure the server:

#### [/etc/nginx/conf.d/server_ssl.conf](https://github.mandiant.com/amilano/uac-node/blob/master/conf/nginx/Mandiant-uac-ws-ssl.template)

        ssl                  on;
        ssl_certificate      /etc/pki/tls/certs/localhost.crt;
        ssl_certificate_key  /etc/pki/tls/private/localhost.key;
        ssl_session_timeout  5m;
        ssl_protocols  SSLv2 SSLv3 TLSv1;
        ssl_prefer_server_ciphers   on;


#### [/etc/nginx/conf.d/uac.conf](https://github.mandiant.com/amilano/uac-node/blob/master/conf/nginx/Mandiant-uac-ws.template)

    # UAC NGINX Settings

    upstream uac.dev.mandiant.com {
        server 127.0.0.1:8000;
    }
    server {
        listen 443;
        server_name localhost uac.dev.mandiant.com;
        underscores_in_headers on;
        access_log /var/log/nginx/uac.log;
        location /static/ {
            root /opt/web/apps/uac/;
            if (!-f $request_filename) {
                return 404;
            }
        }
        location / {
            proxy_pass http://uac.dev.mandiant.com;
            proxy_redirect off;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            proxy_set_header X-NginX-Proxy true;
        }
    }

### Restart nginx

    $ service nginx restart


Install Development Dependencies
--------------------------------

### Install the g++ compiler

In order to build the required npm library dependencies the g++ compiler must be installed.  Run the following command
in order to install the compiler.

    yum install gcc-c++


Install Node.js
---------------

### Install the Mandiant Node RPM.

    rpm -i Mandiant-node-0.10-15.x86_64.rpm

### Or Download the and Extract Node archive.

    <http://nodejs.org/dist/v0.10.15/node-v0.10.15-linux-x64.tar.gz>

    cd /opt/node

    tar -zxf node-v0.10.15-linux-x64.tar.gz

### Install Global Node Development Tools

The following script installs node-supervisor, uglifyjs, etc to the node development instance.  The libraries are
installed globally for use in scripts.

    ./bin/install_global_libs.sh


Install the Application Code
----------------------------

### Copy the code to the following directory:

    /opt/web/app/uac/

### Ensure the bin/ scripts are executable:

    chmod +x /opt/web/app/uac/bin/*

### Install the node library dependencies:

    cd /opt/web/app/uac
    ./bin/install_libs.sh


