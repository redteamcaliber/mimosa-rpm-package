var _ = require('underscore.string');
var fs = require("fs");
var https = require('https');
var http = require('http');
var express = require('express');
var RedisStore = require('connect-redis')(express);

var async = require('async');
var log = require('winston');

// UAC requirements.
var settings = require('settings');
var sso = require('sso');
var route_utils = require('route-utils');
var uac_routes = require('uac-routes');
var sf_routes = require('sf-routes');
var nt_routes = require('nt-routes');


//
// Initialize the application middleware.
//
var app = express();


//
// Setup console logging.
//
log.remove(log.transports.Console);
log.add(log.transports.Console, {
    level: settings.get('server:log_level'),
    colorize: true
});
// Set up file logging.
log.add(log.transports.File, {
    level: settings.get('server:log_level'),
    colorize: true,
    filename: settings.get('server:log_file'),
    json: false,
    timestamp: true,
    maxsize: settings.get('server:log_maxsize'),
    maxfiles: settings.get('server:log_maxfiles')
});

app.configure('dev', function () {
    // Set up development specific configuration.
});

app.configure('prod', function () {
    // Setup production specific configuration.

});

// Enable the proxy support.
app.enable('trust proxy');
console.log(_.sprintf('trust proxy enabled: %s', app.get('trust proxy')));


app.use(express.compress());
app.use(express.favicon(__dirname + '/static/img/mandiant.ico'));
app.use('/static', express.static('static'));

app.use(express.query());
app.use(express.bodyParser());
app.use(express.cookieParser());

app.use(express.session({
    key: 'uac.sess',
    secret: settings.get('server:session_secret'),
    proxy: true,
    cookie: { path: '/', httpOnly: true, secure: true, maxAge: 86400000 },
    store: new RedisStore({
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        prefix: 'sess'
    })
}));

//app.use(express.csrf());

app.use(sso.require_authentication(settings.get('sso')));

app.use(app.router);
app.use(uac_routes);
app.use('/sf', sf_routes);
app.use('/nt', nt_routes);

route_utils.load_views(app);

// Add a 404 handler.
app.use(function (req, res, next) {
    try {
        var uid = route_utils.get_uid(req);
        log.error(_.sprintf('404::User: %s requested non-existent page: %s.', uid, req.originalUrl));

        if (route_utils.is_html_request(req)) {
            route_utils.send404(req, res, next);
        }
        else {
            // Send a 404 response to AJAX clients.
            res.send(404, {error: req.originalUrl + ' is not available.'})
        }
    }
    catch (e) {
        // Error.
        log.error('Error rendering 404 page.');
        next(e);
    }
});

// Add a general error handler.
app.use(function errorHandler(err, req, res, next) {
    var message = 'Global error handler caught exception while rendering %s url: %s (status: %s, uid: %s) \n%s';
    var uid = route_utils.get_uid(req);
    //var stack = err.stack ? err.stack : err;
    var stack;
    if (err && err.stack) {
        stack = err.stack;
    }
    else if (err) {
        stack = err;
    }
    else {
        stack = req.body;
    }

    // Log the error message and stack trace.
    log.error(_.sprintf(message, req.method, req.originalUrl, res.statusCode, uid, stack));

    if (route_utils.is_html_request(req)) {
        // Display the formatted 500 page.
        route_utils.send500(req, res, next, stack);
    }
    else {
        // Send a 500 response to AJAX clients.
        res.send(500, {error: req.originalUrl + ' is not available.'})
    }
});


/**
 * Start the UAC application server.
 */
function startup() {
    console.log('--------------------------');
    console.log('Starting the UAC server...');
    console.log('--------------------------');

    console.log(_.sprintf('server:port=%s', settings.get('server:port')));
    console.log(_.sprintf('server:ssl=%s', settings.get('server:ssl')));

    if (settings.get('server:ssl') === true) {
        https.createServer({
            key: fs.readFileSync(settings.get('server:ssl_key')),
            cert: fs.readFileSync(settings.get('server:ssl_cert'))
        }, app).listen(settings.get('server:port'));
    }
    else {
        http.createServer(app).listen(settings.get('server:port'));
    }

    console.log('---------------------');
    console.log('UAC server running...');
    console.log('---------------------');
}

/**
 * Shut down the UAC application server.
 */
function shutdown() {
    console.log('');
    console.log('-------------------------------');
    console.log('Shutting down the UAC server...');
    console.log('-------------------------------');
    process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', function (err) {
    // Log any error that crashes the server with the keyword = FATAL.
    log.error('FATAL: Encountered an unhandled server exception.');
    if (err && err.stack) {
        log.error(err.stack);
    }
    else if (err) {
        log.error(err);
    }

    // Shut down the server.
    shutdown();
});

// Run the server.
startup();