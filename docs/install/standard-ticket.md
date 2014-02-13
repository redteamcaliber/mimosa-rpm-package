This ticket is to install a new version of UAC.  This install entails the following:
- Upgrade the UAC application (which starts/restarts the UAC application).

Urgency: High
Proposed Deployment Start Time: ASAP
Expected Duration: 15 minutes
Customer Impact: Negligible
Confirm Requester Available to Support Prior to Deployment: Yes
Hosts Involved:  web1.mplex.us2


Additional documentation if needed is at
https://github.mandiant.com/amilano/uac-node/blob/master/docs/production.md


Instructions:

1. Upgrade the UAC RPM file on web1.mplex.us2.  The new RPM is on the FTP site in the following location.

nas1.mplex.us2.mcirt.mandiant.com:/dev_deploy/uac-node/Mandiant-uac-ws-1.1-0.x86_64.rpm

    $ rpm –U Mandiant-uac-ws-1.1-0.x86_64.rpm

2. Ensure UAC is working.  The uac upstart job should start/restart automatically.  https://uac.mplex.mandiant.com
<https://uac.mplex.mandiant.com/> display a web page without errors.