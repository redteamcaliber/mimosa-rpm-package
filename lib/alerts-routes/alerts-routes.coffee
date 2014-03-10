express = require 'express'
nunjucks = require 'nunjucks'

# Setup underscore.
_ = require 'underscore';
_.str = require 'underscore.string'
_.mixin _.str.exports()

# Local modules.
settings = require 'settings'
route_utils = require 'route-utils'
alerts_api = require 'alerts-api'


# Create an app to export.
app = module.exports = express()


# Load the views.
view_env = route_utils.load_views app

###
    Root alerts route.
###
app.get '/', (req, res, next) ->
    context = route_utils.default_context req
    route_utils.render_template(res, '/alerts/alerts.html', context, next);
    return


#
# API Routes.
#
app.get '/api/tags', (req, res) ->
    alerts_api.get_tags (err, tags) ->
        route_utils.send(res, tags)