async = require 'async'

# Setup underscore.
_ = require 'underscore'
_.str = require 'underscore.string'
_.mixin _.str.exports()

moment = require 'moment'
request = require 'm-request'
settings = require 'settings'
log = require 'winston'
api_utils = require 'api-utils'


###
    Tag descriptions.
###
NOTREVIEWED_DESCRIPTION = 'This tag represents a current hit that has been looked at by an analyst. It currently ' +
    'requires more information such as (but not limited to) a File Acquisition, File Listing, or Prefetch ' +
    'information. What the analyst is acquiring should be listed in the comments section.'
INVESTIGATING_DESCRIPTION = 'This is a hit that can not easily be determined as being malicious and needs additional ' +
    'analysis by a senior analyst.'
ESCALATE_DESCRIPTION = 'This is a hit that can not easily be determined as being malicious and needs additional ' +
    'analysis by a senior analyst.'
REPORTABLE_DESCRIPTION = 'This is an interim state for when a hit(s) has been identified as malicious and are ' +
    'currently being written up in Portal.'
REPORTED_DESCRIPTION = 'This state is for after a Portal Compromise has been created. The comments NEED to list the ' +
    'Portal compromise number.'
UNREPORTABLE_DESCRIPTION = 'This is used to represent a \'Benign\' hit. Meaning the IOC matched the intended item ' +
    'but it is not considered malicious. Examples include a registry key where the binary for commodity is no longer ' +
    'present or a password dumper located in a specific directory or host of someone working on the security team.'
DELETE_DESCRIPTION = 'Everything else.'


###
    Return the collection of tag values.
###
get_tags = (callback) ->
    callback null, [
        {id: 'notreviewied', title: 'Not Reviewed', description: NOTREVIEWED_DESCRIPTION, category: 'new'}
        {id: 'investigating', title: 'Investigating', description: INVESTIGATING_DESCRIPTION, category: 'in_progress'}
        {id: 'escalate', title: 'Escalate', description: ESCALATE_DESCRIPTION, category: 'in_progress'}
        {id: 'reportable', title: 'Reportable', description: REPORTABLE_DESCRIPTION, category: 'in_progress'}
        {id: 'reported', title: 'Reported', description: REPORTED_DESCRIPTION, category: 'closed'}
        {id: 'unreportable', title: 'Unreportable', description: UNREPORTABLE_DESCRIPTION, category: 'closed'}
        {id: 'delete', title: 'Delete', description: DELETE_DESCRIPTION, category: 'closed'}
    ]

###
    Return the list of clients.
###
get_clients = (callback) ->
    callback null, [
        {uuid: '777138e4-90f4-43ac-9e28-f87e6181bd62', name: 'Client1'}
        {uuid: '11f7ff04-76f1-43c2-9606-f8f1716b61e7', name: 'Client1'}
    ]

###
    Return the list of alert types.
###
get_alert_types = (callback) ->
    callback null, [
        {uuid: '4cf446ea-8cfc-45b3-8a19-13bb9d390e9a', title: 'Domain-Match'}
        {uuid: '74608b37-a586-4a2f-889c-cb77d4566f86', title: 'Infection-Match'}
        {uuid: '30ab8d54-47c8-4de1-82dd-8d2b5607493a', title: 'Malware-Callback'}
        {uuid: '74ebbc37-ffa8-4d6a-a11b-96b2f184196e', title: 'Malware-object'}
        {uuid: 'ca46f75a-96d6-486f-94c0-1ac8b75a0033', title: 'Web-Infection'}
    ]

###
    Return the timeframe options.
###
get_timeframes = ->
    [
        {id: 'hours_1', title: 'Last Hour', unit: 'hours', unit_value: 1}
        {id: 'hours_10', title: 'Last 10 Hours', unit: 'hours', unit_value: 10}
        {id: 'days_1', title: 'Last Day', unit: 'days', unit_value: 1}
        {id: 'days_2', title: 'Last 2 Days', unit: 'days', unit_value: 2}
        {id: 'days_4', title: 'Last 4 Days', unit: 'days', unit_value: 4}
        {id: 'weeks_1', title: 'Last Week', unit: 'weeks', unit_value: 1}
    ]


exports.get_tags = get_tags
exports.get_clients = get_clients
exports.get_alert_types = get_alert_types
exports.get_timeframes = get_timeframes