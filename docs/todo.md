UAC ToDo
========

### Look into a production upstart configuration for ensure the process is always running.
    -Update the rpm build script as necessary.
    -Update the required production documentation.
    -Test the configuration ensure the server restarts properly.

### Look into adding csrf support into the application - http://expressjs.com/api.html

### Apply an allowed hosts setting so that users cannot accidentally hit UAC direct.

### Gracefully handle when the users session has timed out and making an AJAX call.
    -http://msdn.microsoft.com/en-us/magazine/cc507641.aspx

### Rebuild the local UAC database using the update scripts.

### Look through the source and ensure that the limit is being applied to queries properly.

### Uglify the UAC JS source code.

### Format JS dates on the client.

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
