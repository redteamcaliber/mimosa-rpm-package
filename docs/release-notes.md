Unified Analyst Console (UAC) Release Notes
===========================================

Mandiant-uac-ws-0.5-1 - November 25th, 2013
------------------------------------------

### Merge All

- Added the ability to merge all identities into the latest. When viewing the most recent identity for a hit a merge all
  button is displayed.  Clicking the merge all button merges all identities and comments as well as brings forward the
  tag with highest precedence.

### Suppressed/IOCs

- IOC names now display a ~~strikethrough~~ style on the hit review page if the IOC expression is currently suppressed.
  This will give the analyst the abilty to view all the related hits but determine which ones are being suppressed.
  If you click on a suppressed IOC tab the related suppression is in the Suppressions table.  Selecting the suppression
  from the table will navigate you to the suppression view so you can see the suppressed hits.

### Fixes

- Resolved issue on acquisitions list where state values of submitted were not being properly rendered.
- Resolved issue with IOC Name facet not filtering properly.
- Resolved issue with some tables not staying on the same record after refresh.


Mandiant-uac-ws-0.5-0 - November 21st, 2013
------------------------------------------

### Faceted Hit Review [#25431](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/25431)

- The ability to easily filter hits by a variety of properties has been implemented.  Users are now able to view
  hits facets counts on tagname, IOC, item type, MD5 (if applicable), am cert hash, and user.
- Selecting a facet value will filter the visible hits displaying only those that match the selected criteria.
- Multiple facet types may be selected at the same time allowing the user to narrow the list of hits.
- Clicking on a facet again will remove it from the filter.  Reset clears all selected facets.
- Hits facets are now integrated with hit review view, hosts view, suppressions view, and the hits by tag view.

### Hit Review Sorting

- Sorting has been implemented on the hit review table, host hits table, suppressions hits table, and the hits by tag
  table.  Tagname, summary, and summary 2 have been enabled.

### Table View Pipelining

- Table view "pipelining" has been implemented for optimal paging.  The default hits table views now display 10 records
  by default though load several hundred records in a client cache only returning to the server when necessary.

### Hits Keyboard Shortcut Navigation
- Keyboard shortcuts added for navigating hits.  On a Mac ctrl-u moves to the previous row and ctrl-d moves to the next
  row (similar to vi).  On Windows ctrl-up-arrow moves to the previous record and ctrl-down-arrow moves to the next record.

### General

- Theme support available under the user main (far right menu).  Several open source theme options are now available to
  choose from.  Theme settings are currently stored as a browser cookie.

### Hit Identity

- Identity "merge" will update the tag of the targeted hit if the older version's tag is of higher precedence (ex: older
  reported hit merged into a new notreviewed hit will change the tag of the new notreviewed hit to reported).
- Fixed bug where a suppression was suppressing hits to an IOC's that it was not targeted for.


Mandiant-uac-ws-0.4-0 - November 6th, 2013
------------------------------------------

### Acquisitions

- Acquisitions details available through clicking a row in the acquisitions list.  Only rows that have successfully
  completed will show details.  [#25433](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=A09A90F249C90C242895D7E4321D4D28#userstory/25433)
- The host column values are now linked to the hosts view. [#25604](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=A09A90F249C90C242895D7E4321D4D28#iteration/25604)
- Added Filename Created, Filename Accessed, Filename Modified, Filename Changed to the FileItem audit template (at
  the request of Dan).

### Suppressions

- Enabled client side searching in the suppressions list.  This may need to be removed long term if the number of
  suppressions becomes to large to page on the client.
- Added wrapping to the suppression name.
- Suppressions table items are now linked to the suppressions view.  Selecting a suppression will navigate the user to
  the suppressions view with only the selected suppression in the suppressions table.

### General

- Refactored the env.json settings to be more generic to support re-use across projects.  Will require a merge of the
  settings files.  An updated template is provided.


Mandiant-uac-ws-0.3-0 - October 17th, 2013
-----------------------------------------

### Hit Identity

- Implemented the basic hit identity functions.
   [#24602](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24602)

### General

- Enabled suppressions and mass tagging on all hits views (except suppressions view).
  [#23777](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/23777)
- Hits are now paged via server side processing on the hits by tag view.
  [#24139](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24139)
- Modified portal formatted data to match requested output.
  [#24601](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24601)

### Bug Fixes

- Enabled better wrapping in tables and audits.
- Fixed issue related to auto-suppress option not showing up in Firefox.
- Fixed discovery time label on the hosts view.
  [#25262](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#bug/25262)

### Back End

- Read-only IOC rematching capability exposed to a limited number of analysts in order to evaluate its accuracy.
  [#24837](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24837)


Mandiant-uac-ws-0.2-9 - October 4th, 2013
-----------------------------------------

### Fixes

- Corrected issues with the tables on the suppressions view.


Mandiant-uac-ws-0.2-8 - October 1st, 2013
-----------------------------------------

### General

- Added counts to rolled up table views.
- File acquisition default set to raw.
  [#24264](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24264)
- Renamed the shopping page to IOC Selection.
  [#23750](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/23750)

### Hits

- The previous/next table controls now allow paging through the table results.  Clicking next at the end of the list
  will trigger the table to jump to the next page of data.
  [#24137](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24137)
- Resolved issue with the streams section of the File/Item audit template.
  [#24376](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#bug/24376)
- Modfied Customer/cluster/host link of the hits views to make copy and pasting easier.
  [#24463](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userstory/24463)
- Populating the IOC term value whenever possible on the mass tag form.

### Asynchronous tasks for suppression creation, suppression deletion, and mass tagging.

- The StrikeFinder API was modified to process long running tasks in the background.  If tasks run for more than
  approximately 10 seconds they will be processed in the background.  The results can be checked on the task list.  A
  new task list icon has been added to the main menu.
  [#24275](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#userStory/24275)


Mandiant-uac-ws-0.2-6 - September 20th, 2013
--------------------------------------------

### General

- Added additional overlay panels when loading data to resolve [#23297](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#bug/23297).
  With large audit files taking so long to display a better UI blocking mechanism was necessary.  It should be noted
  that double clicking on the faded area during loading will hide the overlay in case loading is taking too long.
- The hits details views have been refactored to adhere to the UI engineers recommendations.  The audit details and IOC
  details have been swapped giving more attention to the audits and making it easier to view comments.

### Acquisitions

- Resolved acquisitions issue [#23206](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#bug/23206)
  where filtering was not working properly.  This issue is reliant on the last Seasick deployment.

### Suppressions

- Many of the audit template files have now been marked up to enable auto suppressing.  When selecting text the context
  menu will now display an item to automatically suppress the item based on the markup without displaying the dialog.
  The suppression uses an 'is' condition by default.  For instance, 'Suppress File/Item'.  The existing menu item is
  still intact if you wish to bring up the full dialog.  When using the full dialog the ioc term is pre selected when
  it's available.

### Audits

- Converted the XSLT templates to server side templates in the web tier to improve performance.  This should resolve
  bug [#23204](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#bug/23204).
- Improved the rendering of many of the audit types.
- Added a page to be able to view audit HTML output for an audit XML file.
- Resolved [#23366](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#bug/23366),
  Added FileItem/PEInfo/Exports/DllName to the File/Item audit template.
- An audit viewer page was added to support testing of the templates in development.  The page allows you to paste in an
  XML audit and display the results through the UAC template.  The page was used in development though Ross suggested
  that it might be useful for analysts.  It is located at [https://uac.vm.mandiant.com/sf/audit/](https://uac.vm.mandiant.com/sf/audit/).



Mandiant-uac-ws-0.2-5 - September 9th, 2013
-------------------------------------------

### Acquisitions

- Fixed issue with acquisitions requests being reported as failed even though successful.
- Default sort order of the acquisitions table is created desc.
- Enabled table column sorting on fields that Seasick supports.

### Suppressions (removed, see request)

- Updated the Prefetch File Executed to Prefetch Application File Name - #22929.


Mandiant-uac-ws-0.2-4 - September 6th, 2013
-------------------------------------------

### Acquisitions

- Initial acquisitions view is included.
- Hover over of acquisition state gives you details if there is an error.

### IOCs

- New Ross-ified version of the IOC viewer that resolves issues causing XML to be displayed - #22795.
- Updated highlighting and filtering to account for the new viewer.
- Items no longer wrap.

### Bug Fixes

- Tag counts now accurately displayed.
- Hostname on the view by tag view was not displaying properly in some cases.
