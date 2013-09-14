// External modules.
var express = require('express');
var nunjucks = require('nunjucks');

var log = require('winston');
var async = require('async');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

// Local modules.
var settings = require('settings');
var route_utils = require('route-utils');
var sf_api = require('sf-api');


// Create an app to export.
var app = module.exports = express();


//route_utils.load_views(app);
var views = [
    {'directory': 'views'}
];
var loaders = [];
views.forEach(function (view) {
    log.debug('Loading view directory: %s', view.directory);
    loaders.push(new nunjucks.FileSystemLoader(view.directory));
});
var view_env = new nunjucks.Environment(loaders);
view_env.express(app);


app.get('/', function (req, res) {
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

                route_utils.render_template(res, '/sf/shopping.html', context, next);
            }
        }
    );
});

app.get('/hits', function (req, res, next) {
    async.parallel(
        [
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
                context.usersettings = route_utils.stringify(results[0]);
                context.tags = route_utils.stringify(results[1]);

                route_utils.render_template(res, '/sf/hits.html', context, next);
            }
        }
    );
});

app.get('/suppressions', function (req, res, next) {
    sf_api.find_suppressions(req, function (err, suppressions) {
        if (err) {
            next(err);
        }
        else {
            var context = route_utils.default_context(req);
            context.suppressions = route_utils.stringify(suppressions);
            route_utils.render_template(res, '/sf/suppressions.html', context, next);
        }
    });
});

app.get('/suppressions/:suppression_id', function (req, res, next) {
    var suppression_id = req.params.suppression_id;
    if (!suppression_id) {
        res.send(400, '"suppression_id" is required.');
    }
    else {
        var suppression = sf_api.find_suppression(req, suppression_id, function (err, suppression) {
            if (err) {
                next(err);
            }
            else {
                var context = route_utils.default_context(req);
                context.suppressions = [suppression];
                route_utils.render_template(res, '/sf/suppressions.html', context, next);
            }
        });
    }
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
                route_utils.render_template(res, '/sf/hits_by_tag.html', context, next);
            }
        }
    );
});

app.get('/host/:hash', function (req, res, next) {
    var hash = req.params.hash;
    if (!hash) {
        res.send(400, '"hash" is required.');
    }
    async.parallel(
        [
            function (callback) {
                sf_api.get_full_host_by_hash(req, hash, callback)
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
                context.host = route_utils.stringify(results[0]);
                context.tags = route_utils.stringify(results[1]);
                route_utils.render_template(res, '/sf/host.html', context, next);
            }
        }
    );
});

app.get('/acquisitions', function (req, res, next) {
    async.parallel(
        [
            function (callback) {
                sf_api.get_usersettings(req, callback);
            },
            function (callback) {
                sf_api.get_clusters(req, callback);
            }
        ],
        function (err, results) {
            if (err) {
                next(err);
            }
            else {
                var context = route_utils.default_context(req);
                context.usersettings = route_utils.stringify(results[0]);
                context.clusters = route_utils.stringify(results[1]);

                route_utils.render_template(res, '/sf/acquisitions.html', context, next);
            }
        }
    );
});


var AUDIT_TEMPLATE_MAP = {
    fileitem: '/sf/audit/file-item.html',
    processitem: '/sf/audit/process-item.html',
    registryitem: '/sf/audit/registry-item.html',
    serviceitem: '/sf/audit/service-item.html'
};

var AUDIT_FUNCTION_MAP = {
    processitem: function (content) {
        var list = get_list(content.processitem.handlelist.handle);
        // TODO: Can this be done asyncronously???
        async.each(list, function(item) {

        });
        content.handle_map = _.groupBy(list, function(handle) {
            if (handle.name) {
                return handle.type;
            }
            else {
                // Dump unwanted items in the undefined category to be removed later.
                return undefined;
            }
        });
        // Remove any items that are in the undefined category.
        delete content.handle_map[undefined];
        // The list of sorted handle types.
        content.handle_types = _.keys(content.handle_map).sort();
        _.each(content.handle_types, function(key) {
            console.log(key + ' - ' + content.handle_map[key].length);
        });
    }
};

app.get('/api/audit/:rowitem_uuid', function(req, res, next) {
    var rowitem_uuid = req.params.rowitem_uuid;
    if (!rowitem_uuid) {
        res.send(400, '"rowitem_uuid" is required.');
    }
    else {
        sf_api.get_rowitem_content(req, rowitem_uuid, function (err, response) {
            if (err) {
                next(err);
            }
            else {
                if (!response) {
                    res.send(404, 'rowitem_uuid: ' + rowitem_uuid + ' not found.');
                }
                else {
                    var type = response.rowitem_type.toLowerCase();
                    var template = AUDIT_TEMPLATE_MAP[type];
                    if (!template) {
                        next('Unable to locate template for type: ' + type);
                    }
                    else {
                        var context = route_utils.default_context(req);
                        var fn = AUDIT_FUNCTION_MAP[type];
                        if (fn) {
                            fn(response.content);
                        }

                        context.content = response.content;
                        context.get_list = get_list;
                        context.get_map_value = function(map, key, sort) {
                            if (sort) {
                                var list = map[key];
                                return _.sortBy(list, sort);
                            }
                            else {
                                return map[key];
                            }
                        };

                        var ntemplate = view_env.getTemplate(template);
                        response.content = ntemplate.render(context);

                        route_utils.send(res, response);
                    }
                }
            }
        });
    }
});

app.get('/audit/:rowitem_uuid', function (req, res, next) {
    var rowitem_uuid = req.params.rowitem_uuid;
    if (!rowitem_uuid) {
        res.send(400, '"rowitem_uuid" is required.');
    }
    else {
        sf_api.get_rowitem_content(req, rowitem_uuid, function (err, response) {
            if (err) {
                next(err);
            }
            else {
                if (!response) {
                    res.send(404, 'rowitem_uuid: ' + rowitem_uuid + ' not found.');
                }
                else {
                    var type = response.rowitem_type.toLowerCase();
                    var template = AUDIT_TEMPLATE_MAP[type];
                    if (!template) {
                        next('Unable to locate template for type: ' + type);
                    }
                    else {
                        var context = route_utils.default_context(req);
                        var fn = AUDIT_FUNCTION_MAP[type];
                        if (fn) {
                            fn(response.content);
                        }

                        context.content = response.content;
                        context.get_list = get_list;
                        context.get_map_value = function(map, key, sort) {
                            if (sort) {
                                var list = map[key];
                                return _.sortBy(list, sort);
                            }
                            else {
                                return map[key];
                            }
                        };

                        route_utils.render_template(res, template, context, next);
                    }
                }
            }
        });
    }
});


//
// API's
//

app.get('/api/hits', function (req, res, next) {
    var params = route_utils.get_dt_request_params(req);

    if (req.query.services && req.query.clusters && req.query.exp_key) {
        params.services = req.query.services;
        params.clusters = req.query.clusters;
        params.exp_key = req.query.exp_key;
    }
    else if (req.query.usertoken) {
        params.usertoken = req.query.usertoken;
    }
    else if (req.query.tagname) {
        params.tagname = req.query.tagname;
    }
    else if (req.query.am_cert_hash) {
        params.am_cert_hash = req.query.am_cert_hash;
    }
    else if (req.query.suppression_id) {
        params.suppression_id = req.query.suppression_id;
    }
    else {
        // Error, params not satisfied.
        res.send('400', 'Minimum parameters not satisified - ' + req.query);
        log.error('Minimum parameters not specified to hits query.');
        log.error(route_utils.stringify(req.query));
    }

    sf_api.get_hits(req, params, function (err, body) {
        if (err) {
            next(err);
        }
        else {
            // Convert the SF parameters to those understood by datatables.
            route_utils.send(res,
                route_utils.get_dt_response_params(body.results, body.count, body.offset, req.query.sEcho));
        }
    });
});

app.get('/api/hits/:rowitem_uuid/addcomment', function (req, res, next) {
    var rowitem_uuid = req.params.rowitem_uuid;
    sf_api.post_comment(req, rowitem_uuid, req.body.comment, function (err, body) {
        err ? next(err) : route_utils.send(res, body);
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
                    route_utils.send(res, hosts);
                }
            });
        }
        else {
            sf_api.get_full_hosts_by_name(req, hosts_params, function (err, hosts) {
                if (err) {
                    next(err);
                }
                else {
                    route_utils.send(res, hosts);
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
        sf_api.get_full_host_by_hash(req, hash, function (err, host) {
            err ? next(err) : route_utils.send(res, host);
        });
    }
});

app.post('/api/acquire', function (req, res, next) {
    var body = req.body;
    if (!body || !body.am_cert_hash || !body.cluster_uuid || !body.file_name || !body.file_path || !body.method || !body.user || !body.password) {
        // Error
        res.send(400, '"am_cert_hash", "cluster_uuid", "file_name", "file_path", "method", "user", "password" is' +
            'required.');
    }
    else {
        sf_api.post_acquisition(req, body.cluster_uuid, body.am_cert_hash, body, function (err, acquisition_response) {
            if (err) {
                next(err);
            }
            else {
                route_utils.send(res, acquisition_response);
            }
        });
    }
});

/**
 * Retrieve the list of acquisitions by clusters.
 */
app.get('/api/acquisitions/:clusters', function (req, res, next) {
    if (!req.params.clusters) {
        res.send(400, '"clusters" is required.');
    }
    else {
        sf_api.get_acquisitions(req, req.params.clusters, function (err, clusters) {
            err ? next(err) : route_utils.send(res, clusters);
        });
    }
});

app.get('/api/acquisitions', function (req, res, next) {
    var clusters = req.query.clusters;
    if (!clusters) {
        res.send(400, '"clusters" is required.');
    }
    else {
        // Convert the datatables parameters into those understood by SF.
        var params = route_utils.get_dt_request_params(req);
        params.cluster__uuid__in = clusters;

        // Handle sorting.
        var col_map = {
            1: 'cluster',
            2: 'agent',
            3: 'file_path',
            4: 'file_name',
            5: 'create_datetime',
            6: 'update_datetime',
            7: 'user',
            8: 'method',
            9: 'state'
        };
        var sort_param = undefined;
        var sort_col = req.query.iSortCol_0;
        var sort_dir = req.query.sSortDir_0;
        if (sort_col && col_map[sort_col]) {
            sort_param = col_map[sort_col];
        }
        // Handle the sort direction.
        if (sort_param && sort_dir == 'desc') {
            // Enable desc sort.
            sort_param = '-' + sort_param;
        }

        if (sort_param) {
            params.order_by = sort_param;
        }

        log.debug('Sending params...');
        log.debug(JSON.stringify(params));

        sf_api.get_acquisitions(req, params, function (err, body) {
            if (err) {
                next(err);
            }
            else {
                var result = route_utils.get_dt_response_params(body.objects,
                    body.meta.total_count, body.meta.offset, req.query.sEcho);
                route_utils.send(res, result);
            }
        });
    }
});

/**
 * Proxy all unmatched requests to the SF API.
 */
app.all('/api/*', function (req, res, next) {
    if (req.method == 'GET') {
        sf_api.get_sf(req, function (err, body) {
            err ? next(err) : route_utils.send(res, body);
        });
    }
    else if (req.method == 'POST') {
        sf_api.post_sf(req, function (err, body) {
            if (err) {
                next(err);
            }
            else {
                log.debug(body);
                route_utils.send(res, body);
            }
            //err ? next(err) : res.send(route_utils.stringify(body));
        });
    }
    else if (req.method == 'DELETE') {
        sf_api.delete_sf(req, function (err, body) {
            err ? next(err) : route_utils.send(res, body);
        });
    }
    else {
        res.send(405, req.method + ' is not currently supported.');
    }
});


//
// Utils
//

function get_list(item) {
    if (!item) {
        return [];
    }
    else if (Array.isArray(item)) {
        return item;
    }
    else {
        return [item];
    }
}