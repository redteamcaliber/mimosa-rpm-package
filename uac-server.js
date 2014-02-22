/*jslint node: true */
/*jshint strict:false */

var _ = require('underscore.string');
var os = require('os');
var fs = require('fs');
var cluster = require('cluster');
var https = require('https');
var http = require('http');
var express = require('express');

var log = require('winston');

// UAC requirements.
var settings = require('settings');
var sso = require('sso');
var route_utils = require('route-utils');
var uac_routes = require('uac-routes');
var sf_routes = require('sf-routes');
var nt_routes = require('nt-routes');
var test_routes = require('test-routes');

//
// Initialize the application middleware.
//
var app = express();


// Redis session store.
var RedisStore = require('connect-redis')(express);


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

// Enable the proxy support.
app.enable('trust proxy');
console.log(_.sprintf('trust proxy enabled: %s', app.get('trust proxy')));


app.use(express.compress());

app.use(express.favicon(__dirname + '/static/img/mandiant.ico'));
app.use('/static', express.static('static'));

app.use(express.cookieParser());

app.use(express.session({
    key: 'uac.sess',
    secret: settings.get('server:session_secret'),
    proxy: true,
    cookie: { path: '/', httpOnly: true, secure: true },
    store: new RedisStore({
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        ttl: 86400
    })
}));

app.use(express.query());
app.use(express.bodyParser());

app.use(sso.require_authentication(settings.get('sso')));

app.use(express.csrf());

app.use(app.router);

app.use(uac_routes);
app.use('/sf', sf_routes);
app.use('/nt', nt_routes);

app.configure('dev', function () {
    // Load development routes.
    console.log('Loading dev routes...');
    app.use('/test', test_routes);
});

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
            res.send(404, req.originalUrl + ' is not available.');
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
        res.send(500, 'Exception invoking url: ' + req.originalUrl + ' - ' + stack);
    }
});

/**
 * Create a server instance using the global settings.
 */
function create_server() {
    console.log(_.sprintf('server:port=%s', settings.get('server:port')));
    console.log(_.sprintf('server:ssl=%s', settings.get('server:ssl')));

    var host = settings.get('server:host');
    if (!host) {
        host = 'localhost';
    }

    if (settings.get('server:ssl') === true) {
        https.createServer({
            key: fs.readFileSync(settings.get('server:ssl_key')),
            cert: fs.readFileSync(settings.get('server:ssl_cert'))
        }, app).listen(settings.get('server:port'), host);
    }
    else {
        http.createServer(app).listen(settings.get('server:port'), host);
    }

    console.log('Creating worker server...');
}

/**
 * Shut down the UAC application server.
 */
function shutdown() {
    if (cluster.isMaster) {
        console.log('Shutting down cluster master...');
    }
    else {
        console.log('Shutting down server worker...');
    }
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

// Start the server.
var workers = settings.get('server:workers');
var cpus = os.cpus().length;

// Ensure that the numbers of workers is defined.
if (!workers) {
    console.log('WARNING: "server:workers" property is not defined, defaulting to 1');
    workers = 1;
}

// Display a warning if the number of workers is greater that the CPU count.
if (workers > cpus) {
    console.log('WARNING: "server:workers" property is greater than the hardware CPU count' +
        ' (' + workers + ' > ' + cpus + ')');
}

if (workers > 1) {
    // Cluster mode is enabled.
    if (cluster.isMaster) {
        // Configuration for the master node.
        console.log('Cluster mode is ACTIVE, starting ' + workers + ' workers...');
        console.log('Hardware has ' + cpus + ' cores available...');

        for (var worker_index = 1; worker_index <= workers; worker_index++) {
            // Fork a worker.
            console.log('Forking server worker: ' + worker_index + '...');
            cluster.fork();
        }

        cluster.on('listening', function(worker, address) {
            console.log('Worker (' + worker.id + ') listening on address: ' + address.address + ':' + address.port);
        });

        cluster.on('exit', function (worker, code) {// Worker is exiting.
            console.log('Server worker (' + worker.id + ') exiting with code: ' + code + '...');
            cluster.fork();
        });
    }
    else {
        // Start the worker server.
        create_server();
    }
}
else {
    // Start a single server.
    console.log('Cluster mode is INACTIVE...');
    create_server();
}
