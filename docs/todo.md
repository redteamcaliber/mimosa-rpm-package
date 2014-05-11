UAC ToDo
========

### Hits Details Changes

- Create the new audit templates.
- Keyboard shortcuts are firing the next event twice on the alerts details view.
- Disable tagging, mass tagging, and suppressions on the hits view of the suppressions view.
- Convert the artifacts table into a drop down.
- Convert FacetsView to an itemView.
- The table view controls don't seem to be able to cycle through a page and go back.
- Convert IOCDetailsView to an item view or collection view.
- Properly disable the time boxes on the cluster selection view.
- the listeners could be building up when switching rows, need to look into this.
- Need to test the merge and merge all functions (or remove??)
- HX suppressions list is not refreshing after creating a suppression.
- Look into using item view collapsables in utils.collapse.
- Clear the hits and hits detail on reset or clearing of initial parameters.
- Clear on the hits search should clear the local storage.
- Add a suppression deleted handler in all of the top level views.
- Create a FetchController that supports a collapsable???
- Add tag validation in the alerts api.
- Title and breadcrumb updates.
    - Update the alerts title as well as the breadcrumbs...
    - Add previously navigated pages to the breadcrumb view.
    - Add id/context info to the breadcrumbs.
- Format the occurred and updated dates within the header according to how long ago they are.
    - See hosts code.

### Agent Tasks
- Put a block up when displaying the details dialog, it's taking forever.
- May need to put up a block while loading the main agent tasks list, again it's taking forever to load.
- Agent tasks query take forever, partially because they are returning too much data.  Need a summary API.  Is there a
  query being made by Django for each of the relationships?
- Looks like drew has a limit on the current acquisitions calls.

# Host caching
- Utilize host caching with sf.

### Alerts Descriptions
- Update the signature descriptions from the XLS.
- Update the signature in the header to display according to the FE logic.
- Display the explanation/anomoly field.

### Linkable Alerts
- Make the alerts view linkable.

### Alerting Deployment
- Update documentation for new URL configuration.
    - Update template json files.

### Seasick related unit tests are failing.

### Update uac/sf-routes to use send_rest rather than send.

### Update the select2 component to the latest

### Update the typeahead component to the latest.

### Settings Refactoring

### Enter Redwood City user stories into TP.

### MD5 Lookup service
    - Need a service that can return all known details for an MD5.
    - The service should take a timeout value that we can retrieve as many results as possible in a short timeframe.  A
      longer timeout can be specified for retrieving the full results.
    - VirusTotal
        - Document the M-Cube settings changes on the wiki.
        - Update the env.json in such a way to stop checking in the actual values.
        - Update the release notes.
        - Test when using a service that works.
    - NSRL
        - http://www.nsrl.nist.gov/Downloads.htm#isos
        - https://cwiki.corp.mandiant.com/bin/view/CWiki/NSRLDB
    - MTA
        -


### Message Refactoring
- x-Transition display messages to the UAC level.
- Create a better message component that doesn't use growl.

### Component Refactoring

### Update SSO to that it doesn't send to the refresh URL unless the request is a GET.

### Extend the block overlay to the buttons on the hits view.

### Look into automatically do do an MD5 lookup for hits that contain an MD5.

### Look into using Satori API in UAC.

### Modify UAC so that it does not set the hit to investigating when an acquisition is created.


- Move the redis configuration from the server.js file to the settings.

### Look into running UAC as a user other than root.

### Add smaller fonts for all themes.

### Need to have a way to view and manage the UAC sessions.

### Look into base64 encoded GZipped data in the Strings section.
- https://uac.mplex.mandiant.com/sf/hits/0a63a2ba-be5e-4151-8ff0-a119387fc0a9

### Create a user preferences screen with a StrikeFinder tab.

### Linkable Acquisitions
- Allow user to create URL links to acquisitions.

### Acquisition Comments
- Allow users to create comments on acquisitions.
- The initial comments should be the one entered when initiating the acquisition.
- Display acquisition comments on the acquisitions view.
- Display acquisition comments on the hits acquisitions view.

### Externalize UAC/StrikeFinder components into their own git project.

### Comments Enhancements
- Allow comment input to be expanded to be multi-line.

### Need to add item type into the IOC details call and remove the string parsing logic.

### Client Session Timeout
- Look into a way to notify users when their session has timed out on the client.
  Currently you are able to make AJAX calls without knowing your session has expired.

### Puppetize UAC
- Need to have nginx installed.
- Need to lay down the nginx ssl and proxy configs for UAC.
- Need to lay down the node RPM.
- Need to lay down the UAC RPM.
- Need to lay down the UAC env.json config.

### Look through my comments in my notebook for other TODO's.

### Look into a notification chat framework for UAC.

### Notification Framework for UAC
- Create a Node web sockets server for pushing content to UAC.
- Store acquisition request in Redis.
- Poll Seasick for the status of acquisitions in Redis.
- Notify UAC users when their acquisitions are ready.

## Look into the UI feedback email from Cheryl.

## Owned customers report.
- Create a report of customers that currently have hits that are evil or have been marked as evil within the last n days.

## Migrate the common StrikeFinder components classes to a common uac.js file.
- Should have a uac.js, strikefinder.js, and network.js files.
- uac.js should be included in the top level template.

## Modify the select component on all the StrikeFinder popup dialogs to be a select2 component.

## Move the partial templates from the views directory to the static files directory.
- Need to update Grunt scripts.

## Look into performance monitoring for express.
- Look into options.
- Can potentially write out performance monitoring data to files and parse it back in to create reports.
- Can potentially send statistics to Graphite - https://github.com/felixge/node-graphite.
- https://github.com/sivy/node-statsd
- Need to determine what to measure, round trip minus any server calls that I make vs total request time.
- Create an admin page that can return the health of the node server.

### Look into using a using a combination of using Redis and WebSockets for notifications.
- Acquisition notifications.

## Redis UAC reports???
- Keep track of hosts/customers that recently had evil hits.
- Look into the most viewed hits/hosts - http://my.safaribooksonline.com/book/databases/9781617290855/chapter-2dot-anatomy-of-a-redis-web-application/ch02lev1sec5_html
- Cache hostnames from Seasick - http://my.safaribooksonline.com/book/databases/9781617290855/chapter-2dot-anatomy-of-a-redis-web-application/ch02lev1sec4_html

## Upgrade the request library to the latest version.

## Add an option to be able to clear the local data cache.
## Provide a customer message for select2 components when no items are available for selection.

## Look into using RequireJS.
- Should convert to using Bower at the same time: http://bower.io/
- There is a grunt plugin: https://github.com/yatskevich/grunt-bower-task

## Display recent items somewhere in the application.

### Make the UAC start scripts resilient to the directory that are being run in.  It should not matter.

### Remove SSLv2 from the nginx configuration.

### Migrate to a better logging API.
- https://github.com/trentm/node-bunyan
- https://github.com/trentm/node-bunyan/pull/97/files

### Usersettings Migration to UAC.
    - Create tables to store the users ioc selection settings.
    - Create tables to store statistics regarding users actions from the IOC selection view.
    - Create and API to store the users IOC selection settings.
    - Create an API to store and retrieve the users actions on the IOC selection view.
    - Create an API to retrieve the related user actions for a given view.
    - Integrate API's with the UAC shopping view.
    - Integrate view API's with the UAC hits views.
    - When a user viewed a hit or identity, history of what they did related to an identity.

### UAC Client/Cluster groups
    - Create tables and API's related to saving and retrieving client cluster groups.
    - Create an group management screen within UAC.
    - Implement the ability to select a group on the IOC selection view.
    - Implement the ability to select a group on the acquistions view.

### Implement additional info level auditing.
    - Add auditing.
    - Specify that the default UAC log level should be info.
    - Update the default config files.
    - Implement winston syslog.

### Create a UAC settings/preferences page.

### Render hits criteria
    - On the hits view render the details regarding what hits you are viewing.
    - Potentially remove the shopping rollup?

### Bootstrap Stuff

### Integrate the type ahead search box.
    - http://twitter.github.io/typeahead.js/

### Look into implementing a client side table keyword search on the server side paged tables.

### Go through Kim's list of UI refactorings.
    - Update the active menu item.

### Add copy to the context menu.

### Add support for RFC1918 checks to the SSO middleware.

### Look into why add comment is a get and not a post???

### Look into being able to select columns in datatables.

### Gracefully handle when the users session has timed out and making an AJAX call.
    -http://msdn.microsoft.com/en-us/magazine/cc507641.aspx

### Look into canvas IOC viewer.

### Apply an allowed hosts setting so that users cannot accidentally hit UAC direct.

### Uglify CSS support.

### Look into writing logs to syslog.
    -https://github.com/indexzero/winston-syslog
    -https://github.com/schamane/node-syslog
