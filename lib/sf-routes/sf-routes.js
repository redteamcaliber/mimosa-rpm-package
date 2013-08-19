var express = require('express');
var nunjucks = require('nunjucks');
var _ = require('underscore.string');
var async = require('async');
var settings = require('settings');
var log = require('log');
var route_utils = require('route-utils');
var sf_api = require('sf-api');


// Create an app to export.
var app = module.exports = express();


route_utils.load_views(app);


app.get('/', function (req, res ) {
    res.redirect('/sf/shopping');
});

app.get('/shopping', function (req, res, next) {
    async.parallel(
        [
            function (callback) {
                sf_api.get_services(req, callback);
            },
            function (callback) {
                sf_api.get_clusters(req, callback);
            },
            function (callback) {
                sf_api.get_usersettings(req, callback);
            },
            function (callback) {
                sf_api.get_tags(req, callback);
            }
        ],
        function (err, results) {
            if (err) {
                next(err);
            }
            else {
                var context = route_utils.default_context(req);
                context.services = route_utils.stringify(results[0]);
                context.clusters = route_utils.stringify(results[1]);
                context.usersettings = route_utils.stringify(results[2]);
                context.tags = route_utils.stringify(results[3]);

                res.render('/sf/shopping.html', context);
            }
        }
    );
});

app.get('/hits', function (req, res, next) {
    var context = route_utils.default_context(req);
    sf_api.get_tags(req, function (err, tags) {
        if (err) {
            next(err);
        }
        else {
            context.tags = route_utils.stringify(tags);
            res.render('/sf/hits.html', context);
        }
    });
});

app.get('/suppressions', function (req, res) {
    var context = route_utils.default_context(req);
    res.render('/sf/suppressions.html', context);
});

app.get('/hits_by_tag', function (req, res, next) {
    async.parallel(
        [
            function (callback) {
                sf_api.get_searchable_tags(req, callback);
            },
            function (callback) {
                sf_api.get_tags(req, callback);
            }
        ],
        function (err, results) {
            if (err) {
                next(err);
            }
            else {
                var context = route_utils.default_context(req);
                context.searchable_tags = route_utils.stringify(results[0]);
                context.tags = route_utils.stringify(results[1]);
                res.render('/sf/hits_by_tag.html', context);
            }
        }
    );
});

app.get('/host', function (req, res, next) {
    var context = route_utils.default_context(req);
    sf_api.get_tags(req, function(err, tags) {
        if (err) {
            next(err);
        }
        else {
            context.tags = route_utils.stringify(tags);
            res.render('/sf/host.html', context);
        }
    });
});


//
// API's
//

app.get('/api/hits', function(req, res, next) {
    // TODO: Validation.
    if (req.query.iDisplayLength !== undefined) {
        req.query.limit = req.query.iDisplayLength;
    }
    else if (!req.query.limit !== undefined) {
        // If a limit was not supplied then assume all rows are returned.
        req.query.limit = 0;
    }

    if (req.query.iDisplayStart !== undefined) {
        req.query.offset = req.query.iDisplayStart;
    }

    sf_api.get_hits(req, req.query, function(err, body) {
        if (err) {
            next(err);
        }
        else {
            if (body.count !== undefined) {
                body.iTotalDisplayRecords = body.count;
                body.iTotalRecords = body.count;
            }
            if (body.offset !== undefined) {
                body.iDisplayStart = body.offset;
            }
            res.send(route_utils.stringify(body));
        }
    });
});

app.get('/api/hosts', function (req, res, next) {
    var hosts_params = req.query.hosts;
    if (!hosts_params) {
        res.send(400, '"hosts" is required.');
    }
    else {
        if (!Array.isArray(hosts_params)) {
            hosts_params = [hosts_params];
        }

        var isIp = false;
        if (hosts_params.length > 0 && hosts_params[0].indexOf('.') != -1) {
            isIp = true;
        }

        if (isIp) {
            sf_api.get_full_hosts_by_ip(req, hosts_params, function (err, hosts) {
                if (err) {
                    next(err);
                }
                else {
                    res.send(route_utils.stringify(hosts));
                }
            });
        }
        else {
            sf_api.get_full_hosts_by_name(req, hosts_params, function (err, hosts) {
                if (err) {
                    next(err);
                }
                else {
                    res.send(route_utils.stringify(hosts));
                }
            });
        }
    }
});

/**
 * Route for retrieving a single host value by hash.
 */
app.get('/api/hosts/hash/:hash', function (req, res, next) {
    var hash = req.params.hash;
    if (!hash) {
        res.send(400, '"am_cert_hash" is required.');
    }
    else {
        sf_api.get_full_host_by_hash(req, hash, function(err, host) {
            err ? next(err) : res.send(route_utils.stringify(host));
        });
    }
});

app.post('/api/acquire', function(req, res, next) {
    var body = req.body;
    if (!body || !body.am_cert_hash || !body.cluster_uuid || !body.file_name || !body.file_path || !body.method ||
        !body.user || !body.password) {
        // Error
        res.send(400, '"am_cert_hash", "cluster_uuid", "file_name", "file_path", "method", "user", "password" is' +
            'required.');
    }
    else {
        sf_api.post_acquisition(req, body.cluster_uuid, body.am_cert_hash, body, function(err, acquisition_response) {
            if (err) {
                next(err);
            }
            else {
                res.send(route_utils.stringify(acquisition_response));
            }
        });
    }
});


/**
 * Proxy all unmatched requests to the SF API.
 */
app.all('/api/*', function(req, res, next) {
    if (req.method == 'GET') {
        sf_api.get_sf(req, function(err, body) {
            err ? next(err) : res.send(route_utils.stringify(body));
        });
    }
    else if (req.method == 'POST') {
        sf_api.post_sf(req, function(err, body) {
            err ? next(err) : res.send(route_utils.stringify(body));
        });
    }
    else if (req.method == 'DELETE') {
        sf_api.delete_sf(req, function(err, body) {
            err ? next(err) : res.send(route_utils.stringify(body));
        });
    }
    else {
        res.send(405, req.method + ' is not currently supported.');
    }
});