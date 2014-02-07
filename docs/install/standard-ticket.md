This ticket is to install a new version of UAC.  This install entails the following:
- Flush the Redis cache.
- Upgrade the UAC application (which starts/restarts the UAC application).

I would like to install a patch of the UAC application in order to resolve somes issues that users are experiencing.

Urgency: High
Proposed Deployment Start Time: ASAP
Expected Duration: 15 minutes
Customer Impact: Negligible
Confirm Requester Available to Support Prior to Deployment: Yes
Hosts Involved:  web1.mplex.us2


Additional documentation if needed is at
https://github.mandiant.com/amilano/uac-node/blob/master/docs/production.md


Instructions:

Flush the Redis Database

1. On the web1 flush the Redis database.

    $ redis-cli FLUSHDB

2. Upgrade the UAC RPM file on web1.mplex.us2.  The new RPM is on the FTP site in the following location.

nas1.mplex.us2.mcirt.mandiant.com:/dev_deploy/uac-node/Mandiant-uac-ws-1.0-2.x86_64.rpm

    $ rpm –U Mandiant-uac-ws-1.0-2.x86_64.rpm

3. Ensure UAC is working.  The uac upstart job should start/restart automatically.  https://uac.mplex.mandiant.com
<https://uac.mplex.mandiant.com/> display a web page without errors.