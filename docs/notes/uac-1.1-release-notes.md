Unified Analyst Console (UAC) 1.0 Release Notes
===============================================

Mandiant-uac-ws-1.1-2 - February 12th, 2014
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