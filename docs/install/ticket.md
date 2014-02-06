
This ticket is to install a new version of UAC.  This install entails the following:
- Rebuild the UAC database.
- Upgrade the UAC application (which starts/restarts the UAC application).


I would like for the installation to occur this afternoon at approximately 4:30 PM.  A maintenance window has been
established with the analysts for this time.

Urgency: Normal
Proposed Deployment Start Time: 4:30 PM EST
Expected Duration: 15-30 minutes
Customer Impact: Outage is the length of the install process.
Confirm Requester Available to Support Prior to Deployment: Yes
Hosts Involved:  web1.mplex.us2, db1.mplex.us2


Additional documentation if needed is at
https://github.mandiant.com/amilano/uac-node/blob/master/docs/production.md


Instructions:

Stop the UAC Application

1. On the web1 box bring down the UAC application before making any database changes.

    $ stop uac


Rebuild the UAC Database

1. The following database scripts need to be run on the db1.mplex.us2 box.  The first script will drop the existing
UAC database and re-create it.  This install is replacing the existing UAC database as well as it's data.  The old
database only contained transient database that can be re-created.

https://github.mandiant.com/amilano/uac-node/raw/master/sql/create_database.sql
https://github.mandiant.com/amilano/uac-node/raw/master/sql/create_tables.sql
https://github.mandiant.com/amilano/uac-node/raw/master/sql/create_data.sql

NOTE: There is a password in the create_database.sql script that should be synced with the password in the
web1:/opt/web/apps/uac/conf/env.json settings file.  The password should be synced with the "db_pass": "devnet" property.

    CREATE USER uac_user WITH PASSWORD 'devnet';


Deploy an Updated UAC RPM

1. Upgrade the UAC RPM file on web1.mplex.us2.  The new RPM is on the FTP site in the following location.

nas1.mplex.us2.mcirt.mandiant.com:/dev_deploy/uac-node/Mandiant-uac-ws-1.0-0.x86_64.rpm

    $ rpm –U Mandiant-uac-ws-1.0-0.x86_64.rpm

3. Ensure UAC is working.  The uac upstart job should start/restart automatically.  https://uac.mplex.mandiant.com
<https://uac.mplex.mandiant.com/> display a web page without errors.

