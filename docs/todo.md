UAC ToDo
========

## Pull the code ito master.

## Redo the build_rpm script using Grunt.
- Have the build rpm script as well as the html view look for the version information in the package.json file.
- Generate the spec file??
- Build the package using grunt rpm.

## Look into performance monitoring for express.
- Look into options.
- Can potentially write out performance monitoring data to files and parse it back in to create reports.
- Can potentially send statistics to Graphite - https://github.com/felixge/node-graphite.
- https://github.com/sivy/node-statsd
-
- Need to determine what to measure, round trip minus any server calls that I make vs total request time.

## Add an option to be able to clear the local data cache.
## Provide a customer message for select2 components when no items are available for selection.

## Add Expression Key Facet
- Add the ability to filter hits by expression key.  This feature is useful when viewing hits by IOC or IOC uuid.  See
[#27949](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/27949)

## Look into using RequireJS.

## Display recent items somewhere in the application.

### Simplify the IOC Selection Process
- Add a client selection that filters clusters or replaces clusters.
- Allow users to quickly select multiple clients/clusters without having to refresh the IOC summary details.


## Questions



## Tasks

### Make the UAC start scripts resilient to the directory that are being run in.  It should not matter.

### Unselect values from ioc details tables after an expression is selected.

### Use values instead of id's in the select view.

### Remove SSLv2 from the nginx configuration.

### Look into Node clustering to use the available memory on the box.

### Remove passwords from the Grunt script.

### Look into changing the hits page into a SPA.

### Grunt stuff
- contrib-jst - Precompile Underscore templates to JST file.
- build an RPM using grunt.
- compress css?
- JSLint?

### Look into updating the UAC version number automatically.

### Upgrade to Bootstrap3.0.3
- Re-compile the bootswatch templates.

### Migrate to a better logging API.
- https://github.com/trentm/node-bunyan
- https://github.com/trentm/node-bunyan/pull/97/files

### Change .wrap to .column-wrap

### IOC Selection Enhancements
    - Add customers to the IOC selection view.
    - Update the selection components on the IOC selection view to make it easier to select multiple items.

### Usersettings Migration to UAC.
    - Create tables to store the users ioc selection settings.
    - Create tables to store statistics regarding users actions from the IOC selection view.
    - Create and API to store the users IOC selection settings.
    - Create an API to store and retrieve the users actions on the IOC selection view.
    - Create an API to retrieve the related user actions for a given view.
    - Integrate API's with the UAC shopping view.
    - Integrate view API's with the UAC hits views.
    - When a user viewed a hit or identity, history of what they did related to an identity.

### View Hits by IOC UUID and IOC Namehash
    -

### UAC Client/Cluster groups
    - Create tables and API's related to saving and retrieving client cluster groups.
    - Create an group management screen within UAC.
    - Implement the ability to select a group on the IOC selection view.
    - Implmemnt the ability to select a group on the acquistions view.

### Implement additional info level auditing.
    - Add auditing.
    - Specify that the default UAC log level should be info.
    - Update the default config files.
    - Implement winston syslog.

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