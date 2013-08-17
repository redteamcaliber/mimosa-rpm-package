UAC Web Application Installation Documentation
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

#### /etc/nginx/conf.d/server.conf

    #
    # This server makes it so that anyone trying to get to the proxy without a Host:
    # header will get back a 444 error.
    #
    server {
        listen      443;
        server_name "";
        include /etc/nginx/conf.d/server_ssl.conf;
        return      444;
    }

    #
    # This is the main server, it will listen for Host: proxy.mcirt.mandiant.com, and
    # farm out requests based on the files in locations/*.conf
    #
    server {
        listen       443;
        server_name  vm.mandiant.com 192.168.148.200;

        include /etc/nginx/conf.d/server_ssl.conf;

        # The configuration for each location will go in an independent file
        # in this directory.
        include /etc/nginx/conf.d/locations/proxy_*.conf;
    }

#### /etc/nginx/conf.d/server_ssl.conf

        ssl                  on;
        ssl_certificate      /etc/pki/tls/certs/localhost.crt;
        ssl_certificate_key  /etc/pki/tls/private/localhost.key;
        ssl_session_timeout  5m;
        ssl_protocols  SSLv2 SSLv3 TLSv1;
        ssl_prefer_server_ciphers   on;


    /etc/nginx/conf.d/uac.conf

    upstream uac.vm.mandiant.com {
        server 127.0.0.1:8000;
    }
    server {
        listen 443;
        server_name localhost uac.vm.mandiant.com;
        access_log /var/log/nginx/uac.log;
        location ~ /static/ {
            root /opt/web/apps/uac/;
            if (!-f $request_filename) {
                return 404;
            }
        }
        location / {
            proxy_pass https://uac.vm.mandiant.com;
            proxy_redirect off;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            proxy_set_header X-NginX-Proxy true;
        }
    }

#### /etc/nginx/conf.d/uac.conf

    upstream uac.vm.mandiant.com {
        server 127.0.0.1:8000;
    }
    server {
        listen 443;
        server_name localhost uac.vm.mandiant.com;
        underscores_in_headers on;
        access_log /var/log/nginx/uac.log;
        location /static/ {
            root /opt/web/apps/uac/;
            if (!-f $request_filename) {
                return 404;
            }
        }
        location / {
            proxy_pass https://uac.vm.mandiant.com;
            proxy_redirect off;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header Host $http_host;
            proxy_set_header X-NginX-Proxy true;
        }
        #
        # Proxy mapping for the strikefinder python REST API.
        #
        location /sf-api {
    	rewrite /sf-api/(.*) /SFPY/$1 break;
    	proxy_set_header   X-Real-IP        $remote_addr;
    	proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
    	proxy_set_header Host $host;
    	proxy_pass https://10.19.0.70;
    	proxy_redirect https://10.19.0.70 /sf-api;
        }
        #
        # Proxy mapping for the seasick REST API.
        #
        location /ss-api {
    	rewrite /ss-api/(.*) /$1 break;
    	proxy_set_header   X-Real-IP        $remote_addr;
    	proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
    	proxy_set_header Host $host;
    	proxy_pass https://10.19.0.17;
    	proxy_redirect https://10.19.0.17 /ss-api;
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

### Download the Node archive.

    http://nodejs.org/dist/v0.10.15/node-v0.10.15-linux-x64.tar.gz

### Extract the archive to the following directory:

    cd /opt/node

    tar -zxf node-v0.10.15-linux-x64.tar.gz


Install the Application Code
----------------------------

### Copy the code to the following directory:

    /opt/web/app/uac/

### Ensure the bin/ scripts are executable:

    chmod +x /opt/web/app/uac/bin/*

### Install the node library dependencies:

    cd /opt/web/app/uac
    ./bin/install_libs.sh


