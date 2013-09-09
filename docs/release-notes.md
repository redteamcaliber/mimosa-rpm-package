Unified Analyst Console (UAC) Release Notes
===========================================

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