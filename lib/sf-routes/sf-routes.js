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
var sf_api = require('sf-api');


// Create an app to export.
var app = module.exports = express();


var view_env = route_utils.load_views(app);


app.get('/', function (req, res) {
    res.redirect('/sf/shopping');
});

app.get('/shopping', function (req, res, next) {
    async.parallel(
        [
            function (callback) {
                sf_api.get_services(req.attributes, callback);
            },
            function (callback) {
                sf_api.get_clusters(req.attributes, callback);
            },
            function (callback) {
                sf_api.get_usersettings(req.attributes, callback);
            },
            function (callback) {
                sf_api.get_tags(req.attributes, callback);
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
                sf_api.get_usersettings(req.attributes, callback);
            },
            function (callback) {
                sf_api.get_tags(req.attributes, callback);
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

app.get('/hits/:rowitem_uuid', function (req, res, next) {
    if (route_utils.validate_input('rowitem_uuid', req.params, res)) {

        if (!route_utils.is_uuid(req.params.rowitem_uuid)) {
            // Row item input is not valid.
            route_utils.send400(req, res, next, _.sprintf('"%s" is not a valid hit identifier.', req.params.rowitem_uuid));
        }
        else {
            sf_api.get_tags(req.attributes, function(err, tags) {
                if (err) {
                    next(err);
                }
                else {
                    var context = route_utils.default_context(req);
                    context.tags = route_utils.stringify(tags);
                    context.rowitem_uuid = req.params.rowitem_uuid;

                    log.info(context.rowitem_uuid);

                    route_utils.render_template(res, '/sf/hits.html', context, next);
                }
            });
        }
    }
});

app.get('/hits/iocnamehash/:iocnamehash', function (req, res, next) {
    if (route_utils.validate_input('iocnamehash', req.params, res)) {
        sf_api.get_tags(req.attributes, function(err, tags) {
            if (err) {
                next(err);
            }
            else {
                var context = route_utils.default_context(req);
                context.tags = route_utils.stringify(tags);
                context.rowitem_uuid = req.params.rowitem_uuid;

                route_utils.render_template(res, '/sf/hits.html', context, next);
            }
        });
    }
});

/**
 * Display the suppressions list.
 */
app.get('/suppressions', function (req, res, next) {
    async.parallel([
        function(callback) {
            // Retrieve the tags.
            sf_api.get_tags(req.attributes, callback);
        },
        function(callback) {
            // Retrieve the suppressions.
            sf_api.get_suppressions(req.attributes, callback);
        }
    ],
        function(err, results) {
            if (err) {
                // Error
                next(err);
            }
            else {
                // Display the template.
                var context = route_utils.default_context(req);
                context.tags = route_utils.stringify(results[0]);
                context.suppressions = route_utils.stringify(results[1]);
                context.single_entity = false;
                route_utils.render_template(res, '/sf/suppressions.html', context, next);
            }
        }
    );
});

/**
 * Display a suppression by id.
 */
app.get('/suppressions/:suppression_id', function (req, res, next) {
    if (route_utils.validate_input('suppression_id', req.params, res)) {
        if (isNaN(req.params.suppression_id)) {
            // The suppression is not valid.
            route_utils.send400(req, res, next,
                _.sprintf('"%s" is not a valid suppression identifier.', req.params.suppression_id));
        }
        else {
            async.parallel([
                function(callback) {
                    // Retrieve the tags.
                    sf_api.get_tags(req.attributes, callback);
                },
                function(callback) {
                    // Retrieve the suppression.
                    sf_api.get_suppression(req.params.suppression_id, req.attributes, callback);
                }
            ],
                function(err, results) {
                    if (err) {
                        // Error
                        next(err);
                    }
                    else {
                        // Display the template.
                        var context = route_utils.default_context(req);
                        context.tags = route_utils.stringify(results[0]);
                        if (results[1]) {
                            context.suppressions = route_utils.stringify([results[1]]);
                        }
                        else {
                            context.suppressions = route_utils.stringify([]);
                        }
                        context.single_entity = true;
                        route_utils.render_template(res, '/sf/suppressions.html', context, next);
                    }
                }
            );
        }
    }
});

app.get('/hits_by_tag', function (req, res, next) {
    async.parallel(
        [
            function (callback) {
                sf_api.get_searchable_tags(req.attributes, callback);
            },
            function (callback) {
                sf_api.get_tags(req.attributes, callback);
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
    if (route_utils.validate_input('hash', req.params, res)) {
        var hash = req.params.hash;
        async.parallel(
            [
                function (callback) {
                    sf_api.get_full_host_by_hash(hash, req.attributes, callback)
                },
                function (callback) {
                    sf_api.get_tags(req.attributes, callback);
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
    }
});

app.get('/acquisitions', function (req, res, next) {
    async.parallel(
        [
            function (callback) {
                sf_api.get_usersettings(req.attributes, callback);
            },
            function (callback) {
                sf_api.get_clusters(req.attributes, callback);
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

app.get('/audit', function (req, res, next) {
    var context = route_utils.default_context(req);
    route_utils.render_template(res, '/sf/audit.html', context, next);
});

/**
 * Route for the task list view.
 */
app.get('/tasks', function (req, res, next) {
    sf_api.get_tasks(req.attributes, function (err, body) {
        if (err) {
            // Error
            next(err);
        }
        else {
            var context = route_utils.default_context(req);
            context.tasks = route_utils.stringify(body);
            route_utils.render_template(res, '/sf/tasks.html', context, next);
        }
    });
});

app.get('/datatables', function (req, res, next) {
    var context = route_utils.default_context(req);
    route_utils.render_template(res, '/sf/datatables.html', context, next);
});

//
// API's
//


function get_hits_params(req) {
    var params = route_utils.get_dt_request_params(req);

    if (req.query.rowitem_uuid) {
        params.rowitem_uuid = req.query.rowitem_uuid;
    }
    else if (req.query.usertoken) {
        params.usertoken = req.query.usertoken;
    }
    else if (req.query.services && req.query.clusters && req.query.exp_key) {
        params.services = req.query.services;
        params.clusters = req.query.clusters;
        params.exp_key = req.query.exp_key;
    }
    else if (req.query.services && req.query.clusters && req.query.iocnamehash) {
        params.services = req.query.services;
        params.clusters = req.query.clusters;
        params.iocnamehash = req.query.iocnamehash;
    }
    else if (req.query.services && req.query.clusters && req.query.ioc_uuid) {
        params.services = req.query.services;
        params.clusters = req.query.clusters;
        params.ioc_uuid = req.query.ioc_uuid;
    }
    else if (req.query.suppression_id) {
        params.suppression_id = req.query.suppression_id;
    }

    if (req.query.tagname) {
        params.tagname = req.query.tagname;
    }
    if (req.query.iocname) {
        params.iocname = req.query.iocname;
    }
    if (req.query.item_type) {
        params.item_type = req.query.item_type;
    }
    if (req.query.md5sum) {
        params.md5sum = req.query.md5sum;
    }
    if (req.query.am_cert_hash) {
        params.am_cert_hash = req.query.am_cert_hash;
    }
    if (req.query.username) {
        params.username = req.query.username;
    }
    if (req.query.identity_rollup) {
        params.identity_rollup = req.query.identity_rollup;
    }

    return params;
}

app.get('/api/hits', function (req, res, next) {
    var params = get_hits_params(req);

    sf_api.get_hits(params, req.attributes, function (err, body) {
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


app.get('/api/facets', function(req, res, next) {
    var params = get_hits_params(req);

    sf_api.get_hits(params, req.attributes, function (err, body) {
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
    sf_api.post_comment(rowitem_uuid, req.body.comment, req.attributes, function (err, body) {
        err ? next(err) : route_utils.send(res, body);
    });
});

app.get('/api/hosts', function (req, res, next) {
    if (route_utils.validate_input('hosts', req.query, res)) {
        var hosts_params = req.query.hosts;

        if (!Array.isArray(hosts_params)) {
            hosts_params = [hosts_params];
        }

        var isIp = false;
        if (hosts_params.length > 0 && hosts_params[0].indexOf('.') != -1) {
            isIp = true;
        }

        if (isIp) {
            sf_api.get_full_hosts_by_ip(hosts_params, req.attributes, function (err, hosts) {
                if (err) {
                    next(err);
                }
                else {
                    route_utils.send(res, hosts);
                }
            });
        }
        else {
            sf_api.get_full_hosts_by_name(hosts_params, req.attributes, function (err, hosts) {
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
    if (route_utils.validate_input('hash', req.params, res)) {
        sf_api.get_full_host_by_hash(req.params.hash, req.attributes, function (err, host) {
            err ? next(err) : route_utils.send(res, host);
        });
    }
});

app.post('/api/acquire', function (req, res, next) {
    var body = req.body;

    if (route_utils.validate_input(['am_cert_hash', 'file_name', 'file_path', 'method', 'user', 'password'], body, res)) {
        sf_api.post_acquisition(body.cluster_uuid, body.am_cert_hash, body, req.attributes, function (err, acquisition_response) {
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
    if (route_utils.validate_input('clusters', req.params, res)) {
        sf_api.get_acquisitions(req.params.clusters, req.attributes, function (err, clusters) {
            err ? next(err) : route_utils.send(res, clusters);
        });
    }
});

/**
 * Retrieve a list of acquisitions.
 */
app.get('/api/acquisitions', function (req, res, next) {
    if (route_utils.validate_input(['clusters'], req.query, res)) {
        // Convert the datatables parameters into those understood by SF.
        var params = route_utils.get_dt_request_params(req);
        params.cluster__uuid__in = req.query.clusters;

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

        sf_api.get_acquisitions(params, req.attributes, function (err, body) {
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
 * Retrieve the audit details for an acquisition.
 */
app.get('/api/acquisitions/:acquisition_uuid/audit', function (req, res, next) {
    if (route_utils.validate_input(['acquisition_uuid'], req.params, res)) {
        var acquisition_uuid = req.params['acquisition_uuid'];

        async.waterfall([
            function (callback) {
                sf_api.get_acquisition_audit(acquisition_uuid, req.attributes, callback);
            },
            function (result, callback) {
                sf_api.toJSON(result.content, callback);
            },
            function (json, callback) {
                construct_audit_content('fileitem', json, callback);
            },
            function (html) {
                route_utils.send(res, {
                    acquisition_uuid: acquisition_uuid,
                    content: html
                });
            }
        ],
            function (err) {
                // Error handler.
                route_utils.send(res, {
                    acquisition_uuid: acquisition_uuid,
                    content: 'No Audit Available'
                });
            }
        );
    }
});

var AUDIT_TEMPLATE_MAP = {
    appcompatitem: '/sf/audit/app-compat-item.html',
    arpentryitem: '/sf/audit/arp-entry-item.html',
    cookiehistoryitem: '/sf/audit/cookie-history-item.html',
    diskitem: '/sf/audit/disk-item.html',
    dnsentryitem: '/sf/audit/dns-entry-item.html',
    driveritem: '/sf/audit/driver-item.html',
    eventlogitem: '/sf/audit/event-log-item.html',
    filedownloadhistoryitem: '/sf/audit/file-download-history-item.html',
    fileitem: '/sf/audit/file-item.html',
    formhistoryitem: '/sf/audit/form-history-item.html',
    hookitem: '/sf/audit/hook-item.html',
    persistenceitem: '/sf/audit/persistence-item.html',
    portitem: '/sf/audit/port-item.html',
    prefetchitem: '/sf/audit/prefetch-item.html',
    processitem: '/sf/audit/process-item.html',
    registryitem: '/sf/audit/registry-item.html',
    routeentryitem: '/sf/audit/route-entry-item.html',
    serviceitem: '/sf/audit/service-item.html',
    systeminfoitem: '/sf/audit/system-info-item.html',
    systemrestoreitem: '/sf/audit/system-restore-item.html',
    taskitem: '/sf/audit/task-item.html',
    urlhistoryitem: '/sf/audit/url-history-item.html',
    useritem: '/sf/audit/user-item.html',
    volumeitem: '/sf/audit/volume-item.html'
};

var AUDIT_FUNCTION_MAP = {
    processitem: function (content) {
        if (content.processitem.handlelist && content.processitem.handlelist.handle) {
            var list = get_list(content.processitem.handlelist.handle);

            // TODO: Can this be done asyncronously???
            //async.each(list, function (item) {
            //
            //});

            content.handle_map = _.groupBy(list, function (handle) {
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
            _.each(content.handle_types, function (key) {
                console.log(key + ' - ' + content.handle_map[key].length);
            });
        }
        else {
            content.handle_map = {};
            content.handle_types = [];
        }
    }
};

/**
 * Construct the audit response.
 * @param audit_type - the audit type.
 * @param content - the audit xml content.
 * @param callback - function(err, content)
 */
function construct_audit_content(audit_type, content, callback) {
    if (audit_type) {
        audit_type = audit_type.toLowerCase();
    }
    var template_file = AUDIT_TEMPLATE_MAP[audit_type];
    if (!template_file) {
        callback('Unable to locate template for type: ' + audit_type);
    }
    else {
        // Override any of the input content as necessary.
        var fn = AUDIT_FUNCTION_MAP[audit_type];
        if (fn) {
            fn(content);
        }

        // Create a template context environment.
        var context = {
            content: content,
            get_list: get_list,
            get_map_value: get_map_value
        };

        // Render the template.
        var template = view_env.getTemplate(template_file);
        callback(null, template.render(context));
    }
}

app.get('/api/audit/:rowitem_uuid', function (req, res, next) {
    if (route_utils.validate_input('rowitem_uuid', req.params, res)) {
        var rowitem_uuid = req.params.rowitem_uuid;

        sf_api.get_rowitem_content(rowitem_uuid, req.attributes, function (err, response) {
            if (err) {
                next(err);
            }
            else {
                if (!response) {
                    res.send(404, 'rowitem_uuid: ' + rowitem_uuid + ' not found.');
                }
                else {
                    construct_audit_content(response.rowitem_type, response.content, function (err, content) {
                        if (err) {
                            next(err);
                        }
                        else {
                            response.content = content;
                            route_utils.send(res, response);
                        }
                    });
                }
            }
        });
    }
});

/**
 * This API supports the audit test view.  It allows the form to post audit input values and retrieve the corresponding
 * HTML output.
 */
app.post('/api/audit', function (req, res, next) {
    var body = req.body;
    if (route_utils.validate_input('content', body, res)) {
        // Get the XML type.
        body.content = _.trim(body.content);
        var space_index = body.content.indexOf(' ');
        var rowitem_type = body.content.substring(1, space_index);

        // Convert the XML content to a js object.
        var options = {
            normalizeTags: true,
            trim: true,
            explicitArray: false
        };
        xml.parseString(body.content, options, function (err, result) {
            if (err) {
                next(err);
            }
            else {
                //console.dir(result);

                var input = {
                    rowitem_type: rowitem_type,
                    content: result
                };

                construct_audit_content(rowitem_type, input.content, function (err, content) {
                    if (err) {
                        next(err);
                    }
                    else {
                        body.content = content;
                        route_utils.send(res, body);
                    }

                });
            }
        });
    }
});


//
// Proxy pass through.
//

function handle_proxied_response(err, response, body, req, res, next) {
    if (err) {
        if (response.statusCode == 400 || response.statusCode == 404) {
            // Allow the content to pass through.
            res.send(response.statusCode, body);
        }
        else {
            next(err);
        }
    }
    else {
        route_utils.send(res, body);
    }
}

/**
 * Proxy all unmatched requests to the SF API.
 */
app.all('/api/*', function (req, res, next) {
    if (req.method == 'GET') {
        sf_api.get_sf(req, function(err, response, body) {
            handle_proxied_response(err, response, body, req, res, next);
        });
    }
    else if (req.method == 'POST') {
        sf_api.post_sf(req, function(err, response, body) {
            handle_proxied_response(err, response, body, req, res, next);
        });
    }
    else if (req.method == 'DELETE') {
        sf_api.delete_sf(req, function(err, response, body) {
            handle_proxied_response(err, response, body, req, res, next);
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

function get_map_value(map, key, sort) {
    if (sort) {
        var list = map[key];
        return _.sortBy(list, sort);
    }
    else {
        return map[key];
    }
}