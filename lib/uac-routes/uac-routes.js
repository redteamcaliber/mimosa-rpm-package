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
        log.debug('Signing out user: %s', route_utils.get_uid(req));
    }
    if (req.session && req.session.destroy) {
        req.session.destroy();
    }
    req.session = undefined;

    var logout_url = settings.get(settings.SSO_LOGOUT_URL) ? settings.get(settings.SSO_LOGOUT_URL) : '/';
    res.redirect(logout_url);
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

