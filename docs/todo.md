UAC ToDo
========

### Re-factor the env.json.
    -Move the log settings to server.
    -Split the sso into request/sso.

### Gracefully handle when the users session has timed out and making an AJAX call.
    -http://msdn.microsoft.com/en-us/magazine/cc507641.aspx

### Disable the hits link when there is not a usertoken.

### Apply an allowed hosts setting so that users cannot accidentally hit UAC direct.

### Question: Who should we run the UAC web application process as?

### Add counts to the rollups, especially the hits rollup.

### Uglify CSS support.

### Implement a select2.query to catch errors when Seasick is down.
    -http://ivaynberg.github.io/select2/

### Implement the acquisitions list page.
    -https://sick.mandiant.com/api/v1/acquisition/?cluster_uuid__in=9402af9a-f99b-45c3-8f86-651aa1d87f7&cluster_uuid__in=SOME-OTHER-UUID
    -controller, agent, file_path + file_name, state with error_message (if applicable), and then the acquired_file link, comment
    -these are the valid acquisition states for "state"
         created
         started
         completed
         errored
         cancelled
         unknown
    create_datetime, update_datetime, user, method
    could probably ignore comment (I think)

    ordering is done by a param 'order_by' on the GET and defaults to ascending order (similiar to django querysets)
    so for descending agent hostnames' i think youd want to do soemthing like order_by=-agent__hostname

### Refactorings:
    -Break up the client js files using require.js
        -http://backbonetutorials.com/organizing-backbone-using-modules/

    -Find a way to break up the templates so they all don't have to be included in every page.

    -Add RFC1918 checks to the SSO middleware.

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
