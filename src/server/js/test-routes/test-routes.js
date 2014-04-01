var express = require('express');
var _ = require('underscore.string');

var settings = require('settings');
var route_utils = require('route-utils');


var app = module.exports = express();


route_utils.load_views(app);


/**
 * Process a request.  This route runs code that intentionally blocks.
 */
app.get('/block', function (req, res, next) {
    try {
        var start = Date.now();
        console.log('Received block request...');

//        for (var outer = 0; outer < 50; outer++) {
//            for (var inner = 0; inner < 999999; inner++) {
//                var rnd = Math.random() * inner / Math.random();
//            }
//        }

        setTimeout(function() {
            var time = Date.now() - start;
            var message = 'Processing block request in ' + time + 'ms...';

            console.log(message);

            route_utils.send(res, {
                time: time,
                message: message
            });
        }, 5000);
    }
    catch (e) {
        // Error
        next(e);
    }
});

app.get('/cookies', function (req, res) {
    res.send(route_utils.stringify(req.cookies));
});

/**
 * Invoke a test call against the UAC server from the UAC server.
 */
app.get('/runtest', function (req, res, next) {
    uac_api.get_test(req, function (err, response, body) {
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
app.get('/test', function (req, res, next) {
    var content = {}
    content.headers = req.headers;
    res.send(JSON.stringify(content));
});