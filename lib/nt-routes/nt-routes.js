// External modules.
var express = require('express');
var nunjucks = require('nunjucks');
var xml = require('xml2js');
var log = require('winston');
var async = require('async');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

// Local modules.
var settings = require('settings');
var route_utils = require('route-utils');


// Create an app to export.
var app = module.exports = express();


var view_env = route_utils.load_views(app);


app.get('/', function (req, res) {
    res.redirect('/nt/alerts');
});

app.get('/alerts', function (req, res, next) {
    route_utils.render_template(res, '/nt/alerts.html', route_utils.default_context(req), next);
});


//
// API Routes.
//

app.get('/api/alerts', function(req, res, next) {

});
