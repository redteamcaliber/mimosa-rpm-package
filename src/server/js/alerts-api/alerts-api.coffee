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

sf_api = require 'sf-api'

#
# HX alert type.
#
ENDPOINT_MATCH = 'endpoint-match'

#
# Tag descriptions.
#
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


#
# Return the collection of tag values.
#
get_tags = (callback) ->
    tags = [
        {id: 'notreviewed', title: 'Not Reviewed', description: NOTREVIEWED_DESCRIPTION, category: 'new'}
        {id: 'investigating', title: 'Investigating', description: INVESTIGATING_DESCRIPTION, category: 'open'}
        {id: 'escalate', title: 'Escalate', description: ESCALATE_DESCRIPTION, category: 'open'}
        {id: 'reportable', title: 'Reportable', description: REPORTABLE_DESCRIPTION, category: 'open'}
        {id: 'reported', title: 'Reported', description: REPORTED_DESCRIPTION, category: 'closed'}
        {id: 'unreported', title: 'Unreported', description: UNREPORTABLE_DESCRIPTION, category: 'closed'}
        {id: 'delete', title: 'Delete', description: DELETE_DESCRIPTION, category: 'closed'}
    ]
    callback null, tags
    return

#
# Return the list of clients.
#
get_clients = (attributes, callback) ->
    request.json_get get_cv_url('/clients/'), undefined, attributes, (err, response, body) ->
        process_response(err, response, body, callback)
    return

#
# Return the list of alert types.
#
get_alert_types = (attributes, callback) ->
    request.json_get get_cv_url('/alert-types/'), undefined, attributes, (err, response, body) ->
        if body.response
            body.response.push ENDPOINT_MATCH
        process_response(err, response, body, callback)
    return

#
# Return the time frame options.
#
get_times = ->
    [
        {id: 'hours_1', title: 'Last Hour', unit: 'hours', unit_value: 1}
        {id: 'hours_10', title: 'Last 10 Hours', unit: 'hours', unit_value: 10}
        {id: 'days_1', title: 'Last Day', unit: 'days', unit_value: 1}
        {id: 'days_2', title: 'Last 2 Days', unit: 'days', unit_value: 2}
        {id: 'days_4', title: 'Last 4 Days', unit: 'days', unit_value: 4}
        {id: 'weeks_1', title: 'Last Week', unit: 'weeks', unit_value: 1}
    ]

#
# Retrieve the signature summary rollup list.
#
get_signature_summary = (params, attributes, callback) ->
    request.json_get get_cv_url('/signature-summary/'), params, attributes, (err, response, body) ->
        process_response(err, response, body, callback)
    return

#
# Retrieve the consolidated signature summary rollup list.
#
get_consolidated_signature_summary = (params, attributes, callback) ->
    if params and params.alert_type
        if Array.isArray(params.alert_type)
            alert_types = params.alert_type
        else
            alert_types = [params.alert_type]
    else
        alert_types = []

    async.parallel [
            (callback) ->
                if not params or alert_types.length == 0 or ENDPOINT_MATCH in alert_types
                    # Retrieve the endpoint related summary data.
                    p = _.clone(params)
                    delete p.alert_type
                    sf_api.get_ioc_summary_v2 p, attributes, callback
                else
                    callback null, []
                return
            (callback) ->
                if not params or alert_types.length > 1 or not (ENDPOINT_MATCH in alert_types)
                    # Retrieve the CV summary data.
                    p = _.clone(params)
                    p.alert_type = _.without alert_types, ENDPOINT_MATCH
                    get_signature_summary p, attributes, callback
                else
                    callback null, []
                return
        ],
    (err, results) ->
        if err
            callback err
        else
            results[0].forEach (item) ->
                item.alert_types = ['endpoint-match']
                item.device_types = ['HX']

            callback null, results[0].concat(results[1])
        return


#
# Retrieve alerts.
#
get_alerts = (params, attributes, callback) ->
    if params.signature_uuid
        # Retrieve the CV alerts.
        request.json_get get_cv_url('/alerts/'), params, attributes, (err, response, body) ->
            process_response(err, response, body, callback)
            return
    else if params.iocnamehash
        # Retrieve all StrikeFinder alerts.
        params.limit = 0
        sf_params = {}
        if params.tag then sf_params.tagname = get_list_param(params.tag).join()
        if params.client_uuid then sf_params.clients = get_list_param(params.client_uuid).join()
        if params.iocnamehash then sf_params.iocnamehash = params.iocnamehash
        if params.begin then sf_params.begin = params.begin
        if params.end then sf_params.end = params.end

        sf_api.get_hits sf_params, attributes, (err, result) ->
            alerts = []
            for hit in result.results
                alerts.push
                    device:
                        client:
                            name: hit.client_name
                        type: 'HX'
                    summary: hit.summary1
                    src: null
                    dst: null
                    tag: hit.tagname
                    occurred: hit.created
                    priority: 3
                    type: ENDPOINT_MATCH
                    uuid: hit.rowitem_uuid
            callback null, alerts
    else
        callback "Error: Required parameters not met: #{JSON.stringify(params)}"
    return

#
# Retrieve an alert.
#
get_alert = (uuid, attributes, callback) ->
    request.json_get get_cv_url("/alert/#{uuid}"), {}, attributes, (err, response, body) ->
        process_response err, response, body, callback

#
# Construct a candyvan url from the relative url parameter.
#
get_cv_url = (relative_url) ->
    api_utils.combine_urls settings.get('uac:cv_api_url'), relative_url

#
# Process the CV server response.
#
process_response = (err, response, body, callback) ->
    if not callback
        # Error
        log.error "\"callback\" parameter is undefined in call to: #{response.href}"
    else if err
        callback(err)
    else if body
        if body.response
            callback(null, body.response)
        else
            callback("Error: body did not contain a response in call to #{response.href}")
    else
        callback("Error: body was not defined in call to #{response.href}")
    return


#
# Return the parameter as a list.
#
get_list_param = (param) ->
    if not param
        []
    else if Array.isArray param
        param
    else
        [param]
#
# Exports
#
exports.get_tags = get_tags
exports.get_clients = get_clients
exports.get_alert_types = get_alert_types
exports.get_times = get_times
exports.get_signature_summary = get_signature_summary
exports.get_consolidated_signature_summary = get_consolidated_signature_summary
exports.get_alerts = get_alerts
exports.get_alert = get_alert