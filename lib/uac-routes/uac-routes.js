var express = require('express');
var _ = require('underscore.string');
var log = require('winston');

var settings = require('settings');
var route_utils = require('route-utils');
var uac_api = require('uac-api');
var sf_api = require('sf-api');


var app = module.exports = express();


route_utils.load_views(app);

/**
 * Default UAC route.
 */
app.get('/', function (req, res) {
    res.render('/uac/index.html', route_utils.default_context(req));
});

/**
 * UAC logout route.
 */
app.get('/logout', function (req, res) {
    if (req.uid) {
        log.debug('Signing out user: %s', req.attributes.uid);
    }
    if (req.session && req.session.destroy) {
        req.session.destroy();
    }
    req.session = undefined;

    var logout_url = settings.get(settings.SSO_LOGOUT_URL) ? settings.get(settings.SSO_LOGOUT_URL) : '/';
    res.redirect(logout_url);
});

/**
 * TODO: Remove this.
 */
app.get('/cookies', function (req, res) {
    res.send(route_utils.stringify(req.cookies));
});

app.get('/api/iocterms/:type', function(req, res, next) {
    var type = req.params.type;
    if (!type) {
        // Error, type is required.
        res.send(400, '"type" is required.');
    }
    else {
        uac_api.get_ioc_terms(type, function(err, result) {
            if (err) {
                next(err);
            }
            else {
                res.send(route_utils.stringify(result, null, 4));
            }
        })
    }
});

/**
 * Invoke a test call against the UAC server from the UAC server.
 */
app.get('/runtest', function(req, res, next) {
    uac_api.get_test(req, function(err, response, body) {
        if (err) {
            next(err);
        }
        else {
            console.log(body);
            var template = '<html><head></head><body><pre>%s</pre></body></html>';
            res.send(_.sprintf(template, JSON.stringify(body, null, 4)));
        }
    });
});

/**
 * A test URL to hit that returns request content.
 */
app.get('/test', function(req, res, next) {
    var content = {}
    content.headers = req.headers;
    res.send(JSON.stringify(content));
});