UAC ToDo
========

### Creating a suppression for the params below gives back bad hit count.
    "services":["Standard"],
    "clusters":["9402af9a-f99b-45c3-8f86-651aa1d87f75"],
    "exp_key":["76b4d1fec5c1d6d5c9f7c92b2f34f869"],
    "usertoken":"eed8dcd2b82a7f43ff15c84f456bcbd8",
    "lastaction":"2013-08-17 02:32:52+00"}

### Need to update the expression key that is inside the HitsDetailsView whenever a new expression has been selected.

### Write up the user stories from last week before the meeting.

### Uglify the UAC JS source code.

### Format JS dates on the client.

### Gracefully handle when the users session has timed out and making an AJAX call.
    -http://msdn.microsoft.com/en-us/magazine/cc507641.aspx

### Rebuild the local UAC database using the update scripts.

### Disable the hits link when there is not a usertoken.

### Apply an allowed hosts setting so that users cannot accidentally hit UAC direct.

### Question: Who should we run the UAC web application process as?

### Look through the source and ensure that the limit is being applied to queries properly.

### Add counts to the rollups, especially the hits rollup.

### Implement a select2.query to catch errors when Seasick is down.
    -http://ivaynberg.github.io/select2/

### Implement the acquisitions list page.

### Refactorings:
    -Break up the client js files using require.js
        -http://backbonetutorials.com/organizing-backbone-using-modules/

    -Find a way to break up the templates so they all don't have to be included in every page.

### Write a fabric script for configuration a local UAC vm instance?

### Update the active menu item.

### Look into writing logs to syslog.
    -https://github.com/indexzero/winston-syslog
    -https://github.com/schamane/node-syslog

### Look into the exp_key being an array.
    -Is there someway I can safeguard against grabbing the wrong value?
    -Potentially create a helper method to grab this value.


UAC Status
----------

### Code updated to convert over to the SF Python API.
    -New documentation has been updated, will review this with Duane.
    -Implemented some low hanging performance optimizations.
### Currently still proxying all SF and SS requests through the UAC server.
    -Found a better way of doing it using Node.
    -Maintain CSRF checking.
    -Ease of development.
    -Can easily migrate to NGINX in the future if we think it's necessary.
    -Still can hit the UAC server directly though we can implement the proxy restriction anyway.
### Ross, Cheryl, and I met last week regarding SF requirements.
    -Sent out an email with all the outstanding user stories.
    -User stories probably should be prioritized.
