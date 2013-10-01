Unified Analyst Console (UAC) Release Notes
===========================================

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