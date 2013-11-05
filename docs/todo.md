UAC ToDo
========

## Tasks

### Look into closing the dialog views.

### Add some kind over overlay when sorting on the acquisitions page.  It's very slow so it appears as if it's not working.

### Look into better display for the case where there are no hits on the hit review page.

### Setup unit testing for the UAC project.

### *** Send out instructions for the merging of the env.json file ***
    - Several of the settings moved from the uac section up to the server section in order to be more generic and allow
      code sharing between projects.

### Look into Handlebars templates - http://handlebarsjs.com/

### Update the IOC terms.
    - https://github.mandiant.com/OpenIOC/OpenIOC_Terms/blob/master/current.iocterms
    - Look for mistakes and overrides.

### Suppressions table updates
    - If the table is client paged then enable client side filtering and sorting.
    - Remove the nowrap on the first column and test.

### Implement merge all

### Implement facts

### Implement the audit for an acquisition.
    - Implement an API for retrieving an acquisition audit.
        https://sick2.mandiant.com/api/v1/acquisition/c57b89b8-0de6-4df5-9a99-0afa1fbf09b4/fileitem/

### Modify the merge button to be a drop down of action values.

### Make suppressions linkable from the hits view.

### Display N of N Hits in the title bar of the hits table.
    -Suppressions table.
    -Suppressions hits table.
    -Hits by tag hits table.
    -Acquisitions table.

### Add hostname link to the acquisitions table.

# Look into slickgrid - https://github.com/mleibman/SlickGrid and http://dojofoundation.org/packages/dgrid/#demos
    - Roll your own:
        -What do you need?
            - cell renderers
            - paging
            - callbacks
            - sorting
            - searching
            - ajax support

### Look into implementing a client side table keyword search on the server side paged tables.

### Go through Kim's list of UI refactorings.
    - Update the active menu item.

### Process item's need to support scrolling within the collapsable divs.

### Add a link from the acquisition list to the host view.

### Add copy to the context menu.

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