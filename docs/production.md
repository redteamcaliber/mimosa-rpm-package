UAC Web Application Production Installation
===========================================

Install the nginx Web Server
----------------------------

### Add a nginx yum repository.  Edit the following file: /etc/yum.repos.d/nginx.repo

    [nginx]
    name=nginx repo
    baseurl=http://nginx.org/packages/centos/$releasever/$basearch/
    gpgcheck=0
    enabled=1

### Install the NGINX server:

    $ yum install nginx.x86_64
    $ chkconfig nginx on
    $ chkconfig nginx start

Install Node.js
---------------

Install UAC
-----------

Configure the Database
-------------------

### Create the UAC database:

    psql -U postgres < create_database.sql

### Create the UAC Tables:

    psql -U uac_user -d uac < create_uac_tables.sql

### Populate the UAC Data:

    psql -U uac_user -d uac < create_uac_data.sql

Configure NGINX
---------------

### Rename and update the UAC NGINX configuration.

    $ mv /etc/nginx/conf.d/Mandiant-uac-ws.template /etc/nginx/conf.d/Mandiant-uac-ws.conf

### Restart NGINX

    $ service nginx restart