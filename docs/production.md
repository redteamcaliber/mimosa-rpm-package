UAC Web Application Production Installation
===========================================


Configure the Database
-------------------

### Create the UAC database:

    psql -U postgres < create_database.sql

### Create the UAC Tables:

    psql -U uac_user -d uac < create_uac_tables.sql

### Populate the UAC Data:

    psql -U uac_user -d uac < create_uac_data.sql


Install the UAC NGINX Web Server
--------------------------------

### Install the UAC NGINX server:

The UAC web application requires the NGINX web service for SSL and serving up static files.

    $ yum install nginx.x86_64
    $ chkconfig nginx on
    $ service nginx start

Install the UAC Node.js Runtime
-------------------------------

### Install the Mandiant MCIRT Node.js package.

The UAC web application requires the Node.js runtime environment.  The package below installs the runtime to the
default MCIRT location.


    rpm -i Mandiant-node-0.10-15.x86_64.rpm


Install the UAC Web Application
-------------------------------

### Install the Mandiant UAC Web Application package.

    rpm -i Mandiant-uac-ws-0.2-1.x86_64.rpm

### Configure the UAC Application

#### Rename and update the UAC environment applications settings.

The env.json file contains the UAC application settings that are specific to the deployment environment.  Copy the
production template to ./conf/env.json.  Edit the env.json settings as required for the production environment.  The
env.json file is NOT overwritten during package upgrades.

    $ cp /opt/web/apps/uac/conf/prod_env.json /opt/web/apps/uac/conf/env.json

#### Start the UAC Web Application Server

The UAC RPM package installs an upstart configuration file to the /etc/init directory.  Start the server before
continuing by issuing the following command.

    $ start uac

### Configure the UAC NGINX Server

#### Rename and update the UAC NGINX SSL configuration.

The UAC web application package installs a default NGINX SSL conf file.  Rename and edit this file.

    $ mv /etc/nginx/conf.d/ssl.template /etc/nginx/conf.d/Mandiant-uac-ws-ssl.conf

#### Rename and update the UAC NGINX configuration.

The UAC web application package installs a default UAC conf file.  Rename and edit this file.

    $ mv /etc/nginx/conf.d/Mandiant-uac-ws.template /etc/nginx/conf.d/Mandiant-uac-ws.conf


#### Restart NGINX

Restart the NGINX server to apply the configurations changes.

    $ service nginx restart


Update the MPLEX Proxy
----------------------

Users will access the UAC application through the MPLEX proxy.  Therefore a UAC server configuration must be applied to
the NGINX proxy server.

### Add a UAC MPLEX proxy configuration.

Edit and configure the following file.  The server must be modified to match the address of the UAC web service box.
The hostname must match the DNS entry users will be using to access the application.  The addresses for Seasick and
the StrikeFinder API's will also need to be entered.  If this is the first time configuring this file you may need to
update the allowed hosts setting on the API web service configurations.

Note: This guide assumes that an ssl.conf has been applied to the nginx server.

    /etc/nginx/conf.d/uac.conf

    upstream uac.mplex.mandiant.com {
        server 172.30.8.33:443;
    }
    server {
        listen 443;
        server_name localhost uac.mplex.mandiant.com;
        underscores_in_headers on;
        access_log /var/log/nginx/uac.log;

        location / {
            proxy_pass https://uac.mplex.mandiant.com;
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
        proxy_pass https://172.19.0.70;
        proxy_redirect https://172.19.0.70 /sf-api;
        }
        #
        # Proxy mapping for the seasick REST API.
        #
        location /ss-api {
        rewrite /ss-api/(.*) /$1 break;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_pass https://172.19.0.17;
        proxy_redirect https://172.19.0.17 /ss-api;
        }
    }


Test the Application
--------------------

UAC should be accessed via the MPLEX proxy, uac.mplex.mandiant.com should be pointed to the proxy server.

    https://uac.mplex.mandiant.com/



