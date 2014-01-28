UAC Backlog Review Notes
========================

## 2014-01-28

### Work Prioritization
- This is still in a new state, do we have a user story for this?
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/21053

### My Items
- Triaged request: https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/21053
- Ross entered this in July.  User story is on the backlog waiting for prioritization.
- Discussion: Starring vs. What I have Modified

### Acquisition Bug with URI encoding
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/28138
- Ampersand issue, do we have any action?  Can we close?

### Initiate Acquisitions from Hits Table
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/28559
- Triaged this request, user story is on the backlog.

### Suppression management when rematching
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/28611&request=eyJnZW5lcmFsVGFiIjoiZGVzY3JpcHRpb24ifQ==
- Should we create a user story for this?

### Suppressions applying to both notreviewed and investigating
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/28639
- Did we come to a consensus on this?

### Extinct Customers
- Triaged this request.  On the backlog awaiting priortization.
-https://tp.mandiant.com/TargetProcess2/Project/Planning/UserStory/Edit.aspx?RequestID=28794&acid=1CCE9BE1E88DFBE5468210F7D8283E49

### Supressions Not Operator
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/29094
- Any update on this?

### Prefetch and Portal formatted data
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/29109
- Any reason NOT to do this?

### Identities and hit tags
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/29563
- Do we want to add the customer/cluster options to the hits by tag view?
- If so, what are the defaults?

### ReMatch but not remove
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30010
- Triage this?

### Launch Acquisitions on a host without hits
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30053
- Is this a legit use case?

### Hide Acquisitions?
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30055
- Can we close this request, due to My Items?

### Status Change Delayed
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30057
- Triaged this request.

### Hits Not Loading
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30062
- Probably due to large audits, need to confirm.
- What is the plan?

### Acquisition Failure Issue
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30064
- Passed to Seasick queue.

### Merge Identity Feature Request
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30066

### UAC should apply the "investigating" label to all relevant hits
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30067
- Up for discussion.

### New Portal Formatted Data
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=1CCE9BE1E88DFBE5468210F7D8283E49#request/30078
- Is this a feature request?

## 2013-12-10

### From last weeks meeting:

- Need user story related to Request #21053 under Agent Task Management for Work Prioritization.
    - [21053](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/21053)
- Need user story related to Request #21159 under Agent Task Management for Running Scripts.
    - [21159](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/21159)
- What do we plan to do with the user settings related user stories from last week?
    - Looks like these user stories may have been created on the backlog.
- Demo of functionality being released this week.  See [release notes](https://github.mandiant.com/amilano/uac-node/blob/master/docs/release-notes.md).

### Discuss Ross's request to cache acquisition passwords.
- [27912](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/27912)

### Discuss acquisition errors request.
- There are 5-10 of these errors per hour within the UAC logs.
- [27852](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/27852)
- Should this be a design discussion for the afternoon?

### Discuss Handling of Large Audits
- Should this be a design discussion for the afternoon?
- [27831](https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/27831)

### Acquisition Data Required for UAC development in Devnet
- In order to do acquisitions development for UAC I need more data.  There is no longer a record in the dev Seasick
  that returns a file audit.
- Would it be useful to have an acquisition details view that display expands the information including host, comments,
  related errors, audit if available, issues document, etc?

### What to do with Wartell's requests?
- [27802](https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/27802)
- [27803](https://tp.mandiant.com/TargetProcess2/Project/HelpDesk/Request/View.aspx?RequestID=27803)

### INFRA: Pre-compile Partial Templates
- We should pre-compile the client side templates for performance.  Also reduces the page footprint.


## 2012-12-02

### User Settings Selection Enhancements.  Below is a potential user story grouping.

- IOC Selection Enhancements
    - Update the selection components on the IOC selection view to make it easier to select multiple items.
    - Simple updates to make the current IOC selection screen easier to use.

- Usersettings Migration to UAC.
    - Migrate from Clusters to Customers
    - Create tables to store the users ioc selection settings.
    - Create tables to store statistics regarding users actions from the IOC selection view.
    - Create and API to store the users IOC selection settings.
    - Create an API to store and retrieve the users actions on the IOC selection view.
    - Create an API to retrieve the related user actions for a given view.
    - Integrate API's with the UAC shopping view.
    - Integrate view API's with the UAC hits views.
    - When a user viewed a hit or identity, history of what they did related to an identity.

- Providing Shopping Groups Support in UAC
    - Provide the ability to create customer groups within UAC.

### Need a feature related to centralizing comments within UAC.
- Ross: Do we need a user story for this?

### Request from Alex, wants more detailed response from suppression creation.  We should discuss this.
- https://tp.mandiant.com/TargetProcess2/restui/tpview.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/25674
- Create a user story and add it to the the backlog.

### Ross: Can you close the loop on this request with Shanna?  Suppression conversion.
- https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/26982

### Created a user story for this request.  Ross: Needs to be prioritized in the release backlog.
- https://tp.mandiant.com/TargetProcess2/RestUI/TpView.aspx?acid=B2E5D5E30406CE90CBD2E567654B30BF#request/27365
- Link this request to the user story related to suppression name/description.

### This is left over from Cheryl’s meeting minutes from yesterday.
- Request #21053 Needs to be created as a user story under Feature #26180 Agent Task Management
- Request #21159 needs to be created as a user story under Feature #26180  Agent Task Management