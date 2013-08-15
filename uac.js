// External requirements.
var _ = require('underscore.string');
var fs = require("fs");
var https = require('https');
var http = require('http');
var express = require('express');
var async = require('async');

// UAC requirements.
var settings = require('settings');
var log = require('log');
var sso = require('sso');
var uac_routes = require('uac-routes');
var sf_routes = require('sf-routes');


//
// Initialize the application middleware.
//
var app = express();
app.use(express.compress());
app.use(express.favicon(__dirname + '/static/img/mandiant.ico'));
app.use(express.query());
app.use(express.cookieParser());
app.use('/static', express.static('static'));
app.use(express.bodyParser());
app.use(sso.require_authentication(settings.get('sso')));
app.use(app.router);
app.use(uac_routes);
app.use('/sf', sf_routes);

//
// Add error handlers.
//
if ('development' == app.get('env')) {
    // Use the development error handler.
    app.use(express.errorHandler({showStack: true, dumpExceptions: true}));
}
else {
    // Use the production error handler.
    app.use(function errorHandler(err, req, res, next) {
        if (req.xhr) {
            // Ajax request error.
            res.send(500, { error: 'Error while rendering url: ' + req.route});
        }
        else {
            // General error.
            res.render('/uac/500.html');
        }
    });
}

/**
 * Start the UAC application server.
 */
function startup() {
    log.info('');
    log.info('');
    log.info('');
    log.info('Starting the UAC server...');

    if (settings.get('server:ssl') === true) {
        log.info('SSL is ENABLED...');
        https.createServer({
            key: fs.readFileSync(settings.get('server:ssl_key')),
            cert: fs.readFileSync(settings.get('server:ssl_cert'))
        }, app).listen(settings.get('server:port'));
    }
    else {
        log.info('SSL is DISABLED...');
        http.createServer(app).listen(settings.get('server:port'));
    }

    log.info('UAC server running on port: ' + settings.get('server:port') + '...');
}

/**
 * Shut down the UAC application server.
 */
function shutdown() {
    log.info('');
    log.info('');
    log.info('');
    log.info('Shutting down the UAC server...');
    process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', function (err) {
    log.error('Encountered an unhandled server exception.');
    log.error(err.stack);

    // Shut down the server.
    shutdown();
});

// Run the server.
startup();