UAC ToDo
========

## Questions

### Need to discuss what the usersettings is going to return when a user specifies a namehash.
    - Can the user even checkout a namehash or is it just for viewing?
        If checkout is possible then:
            - How will it be visualized on the shopping view?
            - How will I know that a user selected a namehash?
            - Will the exp_key be removed when I checkout a namehash?
    - Should facets be added to the hits by tag view.  If so we may need to decrease the number of columns.  Which ones
      can be removed?

## Tasks

### Change .wrap to .column-wrap

### Pull out the primary color out of a theme on page load.  Use this value for the color of icons (delete suppression).

### Implement hits sorting
    -Add sorting to the hits table on the hits view, host view, suppressions view, and hits by tag view.

### Application themes
    - Look into the host search view.

### Implement additional info level auditing.
    - Add auditing.
    - Specify that the default UAC log level should be info.
    - Update the default config files.

### Look into Grunt build and deployment scripts.
    - http://gruntjs.com/getting-started
    - https://npmjs.org/package/grunt-sed

### Create a UAC settings page.

### Render hits criteria
    - On the hits view render the details regarding what hits you are viewing.
    - Potentially remove the shopping rollup?

### Bootstrap Stuff

### Integrate the type ahead search box.
    - http://twitter.github.io/typeahead.js/

### Add some kind over overlay when sorting on the acquisitions page.  It's very slow so it appears as if it's not working.

### Look into better display for the case where there are no hits on the hit review page.

### Look into Handlebars templates - http://handlebarsjs.com/

### Update the IOC terms.
    - https://github.mandiant.com/OpenIOC/OpenIOC_Terms/blob/master/current.iocterms
    - Look for mistakes and overrides.

### Implement merge all

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