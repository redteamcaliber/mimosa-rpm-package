This ticket is to install a new version of UAC.  This install entails the
following:
- Add additional configuration entries.
- Upgrade the UAC application (which starts/restarts the UAC application).

Urgency: Normal
Proposed Deployment Start Time: 4:15 PM
Expected Duration: 15 minutes
Customer Impact: Negligible
Confirm Requester Available to Support Prior to Deployment: Yes
Hosts Involved:  web1.mplex.us2


Additional documentation if needed is at:
https://github.mandiant.com/amilano/uac-node/blob/master/docs/install/produ
ction-installation.md


Instructions:

1. Add Additional Configuration Entries.  Edit the
/opt/web/apps/uac/conf/env.json file and add an entry for ³host² and
³workers².  Workers is the number of clusters members to start.  Given the
current UAC resources I believe 2 should be a good place to start.

    "server": {
        "host": "localhost",
        "port": 8000,
        "workers": 2,
        "ssl": false,


2. Upgrade the UAC RPM file on web1.mplex.us2.  The new RPM is on the FTP
site in the following location.

nas1.mplex.us2.mcirt.mandiant.com:/dev_deploy/uac-node/Mandiant-uac-ws-1.1-
2.x86_64.rpm

    $ rpm ­U Mandiant-uac-ws-1.1-2.x86_64.rpm

3. Ensure UAC is working.  The uac upstart job should start/restart
automatically.  https://uac.mplex.mandiant.com
<https://uac.mplex.mandiant.com/> display a web page without errors.


