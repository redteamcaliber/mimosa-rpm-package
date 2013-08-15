UAC ToDo
========

### Look into adding csrf support into the application - http://expressjs.com/api.html

### Gracefully handle when the users session has timed out and making an AJAX call.

### Look through the source and ensure that the limit is being applied to queries properly.

### Look into a production upstart configuration for ensure the process is always running.

### Update the UAC database scripts and installations instructions to remove the Django tables.

### Write up installation instructions for nginx on the UAC box.
    -Are any proxy or DNS updates required?

### Uglify the UAC JS source code.

### Package and Install the Application
    -Create an RPM for installing the app and nginx configurations.
    -Create an RPM for installing the node interpreter to /opt/web/bin.

### Refactorings:
    -Break up the client js files using require.js
        -http://backbonetutorials.com/organizing-backbone-using-modules/
    -Update the way that the settings module files are initialized.  Pass in the files rather than assuming the list.
    -Consolidate API calls from the client:
        -Bootstrap the tag list???
        -Consolidate the call for the hits details into one call.
    -Format JS dates on the client.

### Update the active menu item.

### Look into writing logs to syslog.
    -https://github.com/indexzero/winston-syslog
    -https://github.com/schamane/node-syslog

### Look into the exp_key being an array.
    -Is there someway I can safeguard against grabbing the wrong value?
    -Potentially create a helper method to grab this value.

### Authentication and Proxying Questions
* Is it still a goal to have the user contact the REST service directly rather than hitting the UAC server.
* How is UAC going to be deployed in production?
    + Will users be going directly to UAC or through the proxy.  Currently it seems as if they are going to UAC rather
      thank going through the proxy.
    + Hitting UAC via proxy/UAC causes issues with my static files.  I'm able to get around it though kind of a pain.
    + Deploying UAC as a sub-domain uac.mplex.mandiant.com works though any calls to SF or SEASICK are then forwarded
      to UAC rather than the other applications.
    + I can overcome this issue by creating a sub-domain server for UAC and then listing all of the external application
      proxies within that server block.
    + This will work well if users are going directly to UAC. UAC will run nginx on the box to act as a SSL endpoint and
      also proxy all requests to the other servers.
* Other options:
    + Node has a node-http-proxy module that is capable of proxying request through the web application.  The advantage
      of using this method is that the UAC web application could still do the header manipulation that it is doing
      today.
* If we use nginx on the UAC box should I be doing SSL between nginx and the node server.  Is it sufficient enough to
  do http on the backend rather than https.  I have https working.