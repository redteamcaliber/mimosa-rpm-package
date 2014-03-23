express = require 'express'
nunjucks = require 'nunjucks'

# Setup underscore.
_ = require 'underscore';
_.str = require 'underscore.string'
_.mixin _.str.exports()

# Local modules.
settings = require 'settings'
log = require 'log'
route_utils = require 'route-utils'
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

app.get '/api/clients', (req, res, next) ->
    alerts_api.get_clients req.attributes, (err, clients) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, clients

app.get '/api/times', (req, res, next) ->
    route_utils.send_rest req, res, next, alerts_api.get_times()

app.get '/api/types', (req, res, next) ->
    alerts_api.get_alert_types req.attributes, (err, types) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, types

app.get '/api/summary', (req, res, next) ->
    alerts_api.get_signature_summary req.query, req.attributes, (err, list) ->
        if err
            next err
        else
            route_utils.send_rest req, res, next, list