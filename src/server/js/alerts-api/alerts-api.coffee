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

uac_api = require 'uac-api'
sf_api = require 'sf-api'

#
# HX alert type.
#
ENDPOINT_MATCH = 'endpoint-match'

TAGS =
    'notreviewed': 'notreviewed'
    'investigating': 'investigating'
    'escalate': 'escalate'
    'reported': 'reported'
    'unreported': 'unreported'
    'delete': 'delete'

#
# Return the list of clients.
#
get_clients = (attributes, callback) ->
    request.json_get get_cv_url('/api/v1/clients/'), undefined, attributes, (err, response, body) ->
        process_response(err, response, body, callback)
    return

#
# Return the list of alert types.
#
get_alert_types = (attributes, callback) ->
    request.json_get get_cv_url('/api/v1/alert-types/'), undefined, attributes, (err, response, body) ->
        process_response err, response, body, (err, types) ->
            if err
                callback err
            else
                # Add in an endpoint match type.
                types.push ENDPOINT_MATCH
                callback null, types
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
    request.json_get get_cv_url('/api/v1/signature-summary/'), params, attributes, (err, response, body) ->
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
                    # Only retrieve FireEye data.
                    p.service = 'FireEye'
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
        cv_params = _.clone params
        cv_params.limit = 0
        if cv_params.alert_type
            # Remove endpoint match before sending the CV.
            cv_params.alert_type = _.without cv_params.alert_type, ENDPOINT_MATCH

        request.json_get get_cv_url('/api/v1/alerts/'), cv_params, attributes, (err, response, body) ->
            if err
                callback err
            else if body.response
                callback null, _.sortBy body.response, (item) -> return item.priority
            else
                callback null, []
    else if params.iocnamehash
        # Retrieve all StrikeFinder alerts.
        sf_params =
            limit: 0
            services: 'FireEye'
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
                    uuid: hit.uuid
                    identity: hit.identity
                    am_cert_hash: hit.am_cert_hash
                    cluster_uuid: hit.cluster_uuid
                    cluster_name: hit.cluster_name
                    rowitem_type: hit.rowitem_type
            callback null, alerts
    else
        callback "Error: Required parameters not met: #{JSON.stringify(params)}"
    return

#
# Retrieve an alert.
#
get_alert = (uuid, attributes, callback) ->
    request.json_get get_cv_url("/api/v1/alerts/#{uuid}"), {}, attributes, (err, response, body) ->
        process_response err, response, body, (err, alert) ->
            if err
                callback err
            else
                # Mixin a download url.
                cv_url = settings.get 'uac:cv_api_url'
                alert.artifacts.forEach (artifact) ->
                    artifact.url = api_utils.combine_urls cv_url, artifact.file_url
                callback null, alert


#
# Retrieve an alerts content.
#
get_alert_content = (uuid, attributes, callback) ->
    request.json_get get_cv_url("/api/v1/alerts/#{uuid}/content"), {}, attributes, (err, response, body) ->
        callback err, body

#
# Set the tag on an alert.
#
update_alert = (uuid, values, attributes, callback) ->
    async.waterfall(
        [
            (callback) ->
                # Update the alert.
                log.info "Alert: #{uuid} being updated by user: #{attributes.uid}"
                request.form_patch get_cv_url("/api/v1/alerts/#{uuid}"), values, attributes, (err, response, body) ->
                    callback err, response, body
            (response, body, callback) ->
                if 'tag' of values
                    # Write a tag history event.
                    uac_api.create_alert_tag_activity uuid, values.tag, attributes, (err, activity) ->
                        log.info "Tagging alert: #{uuid} to #{values.tag}"
                        callback err, response, body
                else
                    callback null, response, body
        ],
        (err, response, body) ->
            process_response err, response, body, callback
    )

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
        if _.isString(body)
            body = JSON.parse(body)
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
exports.get_clients = get_clients
exports.get_alert_types = get_alert_types
exports.get_times = get_times
exports.get_signature_summary = get_signature_summary
exports.get_consolidated_signature_summary = get_consolidated_signature_summary
exports.get_alerts = get_alerts
exports.get_alert = get_alert
exports.get_alert_content = get_alert_content
exports.update_alert = update_alert