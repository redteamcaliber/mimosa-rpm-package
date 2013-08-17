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


Install the NGINX Web Server
----------------------------

### Install the NGINX server:

    $ yum install nginx.x86_64
    $ chkconfig nginx on
    $ service nginx start

Install Node.js
---------------

### Install the Mandiant MCIRT Node.js package.

    rpm -i Mandiant-node-0.10-15.x86_64.rpm


Install UAC
-----------

### Install the Mandiant UAC Web Application.

    rpm -i Mandiant-uac-ws-0.2-1.x86_64.rpm

### Configure UAC

#### Rename and update the UAC local applications settings template.

    $ mv /opt/web/apps/uac/conf/settings_local.template /opt/web/apps/uac/conf/settings_local.json

### Configure NGINX

#### Rename and update the UAC NGINX SSL configuration.

    $ mv /etc/nginx/conf.d/ssl.template /etc/nginx/conf.d/Mandiant-uac-ws-ssl.conf

#### Rename and update the UAC NGINX configuration.

    $ mv /etc/nginx/conf.d/Mandiant-uac-ws.template /etc/nginx/conf.d/Mandiant-uac-ws.conf


#### Restart NGINX

    $ service nginx restart


Test the Application
--------------------

UAC should be accessed via the MPLEX proxy, uac.mplex.mandiant.com should be pointed to the proxy server.

    https://uac.mplex.mandiant.com/



