Unified Analyst Console (UAC) 1.0 Release Notes
===============================================

Mandiant-uac-ws-1.1-4 - March 31st, 2014
-------------------------------------------

### MD5 Lookups
- Resolved issue related to auto-suppress not working correctly with MD5's.
- Resolved issue where the IOC term was not being pre-populated on some forms.
- Changes added related to cutting over to the production M-Cube service.


Mandiant-uac-ws-1.1-3 - February 5th, 2014
-------------------------------------------

### Hit Review
- Added VirusTotal lookups to the MD5 values on the File, Persistence, Service audit details.  The count of anti-virus
  vendors that detected the MD5 is displayed.  Clicking on the on the link will display detailed information about the
  detected items.  The extended MD5 details are not currently available via API so a link is provided to the VirusTotal
  web site for the full MD5 details.
- If the internal VirusTotal service is service is unavailable a message is display stating the details for the item is
  not available.


Mandiant-uac-ws-1.1-2 - February 26th, 2014
-------------------------------------------

### Hit Review
- Added the ability to download hits to CSV file format.  Links have now been added to hit review and host views.

### Other
- Added web clustering capability to enhance performance.
- Resolved session related issue that was causing errors after being logged in for extensive periods of time.


Mandiant-uac-ws-1.1-0/1 - February 12th, 2014
---------------------------------------------

### IOC Selection
- Updated the expression display to the following format itemType(expression).
- Hovering over the expression displays the expression string.

### Acqusitions
- When selecting an acquisition a details dialog is now displayed including any related "issues".

### IOC Selection
- The IOC selection view now displays the users selections after an IOC Name, IOC UUID, or IOC expression is selected.
  This will give users context into the hits that they are viewing.

### Themes
- Added Lumen, Superhero, and Yeti themes.

### Fixes
- Fixed issue with acquisition audit collapse interfering with the hit audit collapse.
- Clear other IOC details tables after an expression is selected.
- Strings audit sections are expanded by default.
- Resolved issue with displaying errored acquisitions.