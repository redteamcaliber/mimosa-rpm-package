UAC ToDo
========

### Implement task results for:
    - Creating suppressions
    - Mass tagging.
    - Deleting suppressions.

### Use infinite scrolling and display N of N Hits in the title bar of the hits table.
    -Suppressions table.
    -Suppressions hits table.
    -Hits by tag hits table.
    -Acquisitions table.

### Add username to the error log output.

### Look into implementing a client side table keyword search on the server side paged tables.

### Remove the IOC name from the hits page.

### When displaying a hit after checkout then logout there is an error when clicking on the hits link.
    - Disable the hits link when there is not a usertoken.

### Pre-select the IOC term on the mass tag dialog whenever possible.

### #23777 - Allow Suppression Creation on All Hits Views

### Need the ability to link to a hit in uac.

### Add server side paging to the hits by tag view.  There are too many hits to reasonably display the current data.

### Tagging
    - Replace the tagging component with something that is stateful.
    - Refresh the host view whenever an item is tagged because the counts need to be updated.
    - Move the tag component closer to the audit data.

### Go through Kim's list of UI refactorings.
    - Update the active menu item.

### Process item's need to support scrolling within the collapsable divs.

### Add a link from the acquisition list to the host view.

### Add copy to the context menu.

### Make suppressions linkable from the hits view.

### Add counts to the rollups, especially the hits rollup.
    - Comments, hits by tag, suppressions, suppress hits.

### Add support for RFC1918 checks to the SSO middleware.

### Improve the 500 error reporting in UAC.

### Look into why add comment is a get and not a post???

### Look into sorting issues with the previous next control.

### Look into being able to select columns in datatables.

### Look into making API level unit tests possible.

### Automatically update the version number???

### Gracefully handle when the users session has timed out and making an AJAX call.
    -http://msdn.microsoft.com/en-us/magazine/cc507641.aspx

### Look into canvas IOC viewer.

### Apply an allowed hosts setting so that users cannot accidentally hit UAC direct.

### Uglify CSS support.

### Refactorings:
    -Break up the client js files using require.js
        -http://backbonetutorials.com/organizing-backbone-using-modules/

    -Find a way to break up the templates so they all don't have to be included in every page.

### Write a fabric script for configuration a local UAC vm instance?

### Look into writing logs to syslog.
    -https://github.com/indexzero/winston-syslog
    -https://github.com/schamane/node-syslog

### Look into the exp_key being an array.
    -Is there someway I can safeguard against grabbing the wrong value?
    -Potentially create a helper method to grab this value.


Completed
---------

### IOC Viewer
    -Adjust the highlighting based on the new viewer.
### Make the bulk seasick host lookup a post.