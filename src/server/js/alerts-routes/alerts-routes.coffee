express = require 'express'
nunjucks = require 'nunjucks'
async = require 'async'

# Setup underscore.
_ = require 'underscore';
_.str = require 'underscore.string'
_.mixin _.str.exports()

# Local modules.
settings = require 'settings'
log = require 'log'
route_utils = require 'route-utils'

uac_api = require 'uac-api'
alerts_api = require 'alerts-api'


# Create an app to export.
app = module.exports = express()


# Load the views.
view_env = route_utils.load_views app

#
# Root alerts route.
#
app.get '/', (req, res, next) ->
    context = route_utils.default_context req
    route_utils.render_template(res, '/alerts/alerts.html', context, next);
    return

#
# Test route.
#
app.get '/test', (req, res, next) ->
    context = route_utils.default_context req
    route_utils.render_template(res, '/alerts/test.html', context, next);
    return

#
# API Routes.
#

app.get '/api/tags', (req, res, next) ->
    alerts_api.get_tags (err, tags) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, tags
    return

app.get '/api/clients', (req, res, next) ->
    alerts_api.get_clients req.attributes, (err, clients) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, clients
    return

app.get '/api/times', (req, res, next) ->
    route_utils.send_rest req, res, next, alerts_api.get_times()

app.get '/api/types', (req, res, next) ->
    alerts_api.get_alert_types req.attributes, (err, types) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, types
    return

#
# Retrieve the alerts signature summary data.
#
app.get '/api/summary', (req, res, next) ->
    alerts_api.get_consolidated_signature_summary req.query, req.attributes, (err, list) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, list
    return

app.get '/api/alerts', (req, res, next) ->
    alerts_api.get_alerts req.query, req.attributes, (err, list) ->
        if  err
            next err
        else
            route_utils.send_rest req, res, next, list
    return

app.get '/api/alerts/:uuid', (req, res, next) ->
    if route_utils.validate_input ['uuid'], req.params, res
        alerts_api.get_alert req.params['uuid'], req.attributes, (err, alert) ->
            if err
                next err
            else
                route_utils.send_rest req, res, next, alert
    return

app.get '/api/alerts/:uuid/content', (req, res, next) ->
    if route_utils.validate_input ['uuid'], req.params, res
        alerts_api.get_alert_content req.params['uuid'], req.attributes, (err, content) ->
            if err
                next err
            else
                route_utils.send_rest req, res, next, content
    return

app.get '/api/alerts/:uuid/full', (req, res, next) ->
    if route_utils.validate_input ['uuid'], req.params, res
        async.parallel [
            (callback) ->
                alerts_api.get_alert req.params.uuid, req.attributes, callback
            (callback) ->
                alerts_api.get_alert_content req.params.uuid, req.attributes, callback
        ],
            (err, result) ->
                if err
                    next err
                else
                    route_utils.send_rest req, res, next,
                        alert: result[0]
                        content: result[1].alert

                return
    return

app.get '/api/alerts/:uuid/activity', (req, res, next) ->
    if route_utils.validate_input ['uuid'], req.params, res
        uac_api.get_alert_activity req.params['uuid'], (err, activity) ->
            route_utils.send_rest req, res, next, activity

app.post '/api/alerts/:uuid/activity', (req, res, next) ->
    if route_utils.validate_input ['uuid'], req.params, res
        if route_utils.validate_input ['comment'], req.body, res
            uac_api.create_alert_comment_activity req.params.uuid, req.body.comment, req.attributes, (err, activity) ->
                if err
                    next err
                else
                    route_utils.send_rest req, res, next, activity

#
# Update the tag of an alert.
#
app.patch '/api/alerts/:uuid', (req, res, next) ->
    console.dir req.params
    if route_utils.validate_input ['uuid'], req.params, res
        alerts_api.update_alert req.params.uuid, tag: req.body.tag, req.attributes, (err, alert) ->
            route_utils.send_rest req, res, next,
                alert
