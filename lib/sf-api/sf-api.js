var async = require('async');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var moment = require('moment');
var request = require('m-request');
var settings = require('settings');
var log = require('winston');
var api_utils = require('api-utils');
var xml = require('xml2js');


var uac_api = require('uac-api');


/**
 * Retrieve the list of MCIRT services.
 * @param attributes - sso attributes.
 * @param callback - function(err, services)
 */
function get_services(attributes, callback) {
    var url = get_sf_url('services');
    request.json_get(url, {}, attributes, function (err, response, body) {
        callback(err, body);
    });
}

function get_clusters(attributes, callback) {
    var url = get_sf_url('clusters');
    request.json_get(url, {}, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Retrieve the services, clients, and clusters lists in parallel.
 * @param attributes - the sso attributes.
 * @param callback - function(err, results).
 */
function get_services_clients_clusters(attributes, callback) {
    async.parallel(
        [
            function (callback) {
                get_services(attributes, callback);
            },
            function (callback) {
                get_clusters(attributes, callback);
            }
        ],
        function (err, results) {
            if (err) {
                callback(err);
            }
            else {
                var services = results[0];
                var clusters = results[1];
                var client_map = {};
                clusters.forEach(function (cluster) {
                    if (!(cluster.client_uuid in client_map)) {
                        client_map[cluster.client_uuid] = {
                            client_uuid: cluster.client_uuid,
                            client_name: cluster.client_name,
                            client_alias: cluster.client_alias
                        }
                    }
                });
                callback(null, {
                    services: services,
                    clients: _.values(client_map),
                    clusters: clusters
                });
            }
        });
}

/**
 * Retrieve the list of tag names.
 * @param attributes - sso attributes.
 * @param callback - function(err, tagnames)
 */
function get_tags(attributes, callback) {
    var url = get_sf_url('tags');
    request.json_get(url, {}, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Retrieve the list of tag values that can be seached on.
 * callback - function(err, tags)
 */
function get_searchable_tags(attributes, callback) {
    var url = get_sf_url('tags');
    request.json_get(url, {}, attributes, function (err, response, body) {
        var results = [];
        body.forEach(function (tag) {
            if (tag.name != 'notreviewed') {
                results.push(tag);
            }
        });
        callback(err, results);
    });
}

function get_ioc_summary(params, attributes, callback) {
    var url = get_sf_url('ioc-summary');
    request.json_get(url, params, attributes, function (err, response, body) {
        callback(err, body);
    })
}

/**
 * Retrieve hits based on the params.
 * @param params
 * @param attributes
 * @param callback
 */
function get_hits(params, attributes, callback) {
    var url = get_sf_url('hits');
    request.json_get(url, params, attributes, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            // If there are results and the user has chosen to view hits by tagname.  Merge in Seasick hostname data.
            if (body.results && body.results.length > 0 && params.tagname) {
                // Get the list of hashes for the hits.
                var hash_list = [];
                body.results.forEach(function (row) {
                    hash_list.push(row.am_cert_hash);
                });

                get_hosts_by_hash_list(hash_list, attributes, function (err, hosts) {
                    if (err) {
                        // Error, unable to obtain the related host data from seasick.  Return the results anyway
                        // indicating that there was an error.
                        log.error('Unable to retrieve hosts from seasick - ' + err);
                        body.results.forEach(function (row) {
                            row.hostname = '[Error]';
                        });
                    }
                    else {
                        // Add the host to each of the hits.
                        var host_map = {};
                        hosts.forEach(function (host) {
                            host_map[host.hash] = host;
                        });

                        body.results.forEach(function (row) {
                            row.hostname = row.am_cert_hash in host_map ?
                                host_map[row.am_cert_hash].hostname : '';
                        });
                    }

                    // Return the merged results.
                    callback(null, body);
                });
            }
            else {
                callback(null, body);
            }
        }
    });
}

/**
 * Find all suppressions.  This call does NOT page results and returns all suppressions.
 * @param attributes - sso attributes.
 * @param callback - function(err, suppressions)
 */
function get_suppressions(attributes, callback) {
    var url = get_sf_url('suppressions');
    request.json_get(url, {limit: 0}, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Retrieve a suppression by id.
 * @param suppression_id - the suppression id.
 * @param attributes - sso attributes.
 * @param callback - function(err, suppression).
 */
function get_suppression(suppression_id, attributes, callback) {
    var url = get_sf_url('suppressions');
    request.json_get(url, {suppression_id: suppression_id}, attributes, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            if (!body || body.length == 0) {
                // The suppression was not found.
                callback(null, null);
            }
            else if (body.length == 1) {
                callback(null, body[0]);
            }
            else {
                console.dir(body);
                callback('Unable to process get_suppression response: ' + body);
            }
        }
    });
}

function get_rowitem_content(rowitem_uuid, attributes, callback) {
    var url = get_sf_url(_.sprintf('hits/%s/content', rowitem_uuid));
    request.json_get(url, {}, attributes, function (err, response, body) {
        if (err) {
            if (response && response.statusCode == 404) {
                callback(null, null);
            }
            else {
                callback(err);
            }
        }
        else {
            toJSON(body.content, function (err, json) {
                if (err) {
                    callback(err);
                }
                else {
                    body.content = json;
                    callback(null, body);
                }
            });
        }
    });
}

function toJSON(xml_content, callback) {
    var options = {
        normalizeTags: true,
        trim: true,
        explicitArray: false
    };
    xml.parseString(xml_content, options, function (err, json) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, json);
        }
    });
}

/**
 * Retrieve the tag summary counts for a host.
 * @param am_cert_hash - the host to match.
 * @param attributes - the original request.
 * @param callback - function(err, response, body).
 */
function get_tag_summary_by_hash(am_cert_hash, attributes, callback) {
    var url = get_sf_url('tag-summary?am_cert_hash=' + am_cert_hash);
    request.json_get(url, {}, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Retrieve the list of tasks for a user.
 * @param attributes - sso attributes.
 * @param callback - function(err, body)
 */
function get_tasks(attributes, callback) {
    var url = get_sf_url('tasks');
    request.json_get(url, {}, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Post a tag to a row.
 * @param rowitem_uuid - the row.
 * @param attributes - sso attributes.
 * @param tagname - the tag.
 * @param callback - function(err, body)
 */
function post_tag(rowitem_uuid, attributes, tagname, callback) {
    var body = {
        tagname: tagname
    };
    var url = get_sf_url(_.sprintf('hits/%s/settag', rowitem_uuid));
    request.json_post(url, body, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Post a comment to a row.
 * @param rowitem_uuid - the row.
 * @param comment - the body containing the comment.
 * @param attributes - sso attributes.
 * @param callback - function(err, body)
 */
function post_comment(rowitem_uuid, comment, attributes, callback) {
    var body = {
        comment: comment,
        token: 'NA',
        type: 'default'
    };
    var url = get_sf_url(_.sprintf('hits/%s/addcomment', rowitem_uuid));
    request.json_post(url, body, attributes, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Process the hosts adding counts and host metadata to each item.
 * @param hosts - the list of hosts.
 * @param attributes - sso attributes.
 * @param callback - function(err, hosts)
 */
function process_hosts(hosts, attributes, callback) {
    async.each(
        hosts,
        function (host, callback) {
            get_tag_summary_by_hash(host.hash, attributes, function (err, counts) {
                if (err) {
                    callback(err);
                }
                else {
                    host.counts = counts;
                    callback();
                }
            });
        },
        function (err) {
            // Return the processed hosts.
            if (err) {
                callback(err);
            }
            else {
                add_host_metadata(hosts);
                callback(null, hosts);
            }
        }
    );
}

/**
 * Add additional metadata for display to each of the hosts.
 */
function add_host_metadata(hosts) {
    var last_2_hours = moment().subtract('hours', 2);
    var last_24_hours = moment().subtract('hours', 24);
    var last_48_hours = moment().subtract('hours', 48);

    hosts.forEach(function (host) {
        if (host.time_logged) {
            // Add the time metadata.
            var time_logged = moment(host.time_logged, 'YYYY-MM-DDTHH:mm:ss Z');

            log.debug('time_logged: ' + time_logged.format('YYYY-MM-DD HH:mm:ss'));
            log.debug('last 2 hours: ' + last_2_hours.format('YYYY-MM-DD HH:mm:ss'));
            log.debug('within 2 hours: ' + time_logged.isAfter(last_2_hours));

            host.time_formatted = time_logged.format('YYYY-MM-DD HH:mm:ss');
            if (time_logged.isAfter(last_2_hours) || time_logged.isSame(last_2_hours)) {
                host.time_caption = 'Within 2 Hours';
                host.time_label = 'success';
            }
            else if (time_logged.isAfter(last_24_hours) || time_logged.isSame(last_24_hours)) {
                host.time_caption = 'Within 24 Hours';
                host.time_label = 'info';
            }
            else if (time_logged.isAfter(last_48_hours) || time_logged.isSame(last_48_hours)) {
                host.time_caption = 'Within 48 Hours';
                host.time_label = 'warning';
            }
            else {
                host.time_caption = 'More Than 48 Hours';
                host.time_label = 'danger';
            }
        }
        else {
            // Unable to render time metadata.
            host.time_formatted = 'NA';
            host.time_caption = 'NA';
        }
    });
}

/**
 * Retrieve the host data by am_cert_hash.  The response will contain the related IOC summary counts.
 * @param hash - the am_cert_hash criteria.
 * @param attributes - sso attributes.
 * @param callback - function(err, host)
 */
function get_full_host_by_hash(hash, attributes, callback) {
    async.waterfall(
        [
            function (callback) {
                // Retrieve the host.
                get_host_by_hash(hash, attributes, callback);
            },
            function (host, callback) {
                log.error(JSON.stringify(host));
                // Mix in the ioc summary counts.
                host ? process_hosts([host], attributes, callback) : callback(null, []);
            }
        ],
        function (err, hosts) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, hosts[0]);
            }
        }
    );
}

/**
 * Retrieve the matching hosts for the list of ip's and mix in the related tag counts for each host.
 * @param ips
 * @param attributes
 * @param callback
 */
function get_full_hosts_by_ip(ips, attributes, callback) {
    async.waterfall(
        [
            function (callback) {
                // Retrieve the hosts by ip address.
                get_hosts_by_ip(ips, attributes, callback);
            },
            function (hosts, callback) {
                process_hosts(hosts, attributes, callback);
            }
        ],
        function (err, hosts) {
            callback(err, hosts);
        }
    );
}

/**
 * Retrieve the matching hosts for the list of hostnames and mix in the related tag counts for each host.
 * @param hostnames
 * @param attributes
 * @param callback
 */
function get_full_hosts_by_name(hostnames, attributes, callback) {
    async.waterfall(
        [
            function (callback) {
                get_hosts_by_name(hostnames, attributes, callback);
            },
            function (hosts) {
                // For each of the hosts look up the tag counts and add metadata.
                process_hosts(hosts, attributes, callback);
            }
        ],
        function (err, hosts) {
            callback(err, hosts);
        }
    );
}

/**
 * Forward a GET request to the SF API.
 * @param req - the original request.
 * @param callback - function(err, response, body)
 */
function get_sf(req, callback) {
    var url = get_sf_url(req.originalUrl.substring('/sf/api'.length, req.originalUrl.length));
    request.json_get(url, {}, req.attributes, callback);
}

/**
 * Forward a POST request to the SF API.
 * @param req - the original request.
 * @param callback - function(err, response, body)
 */
function post_sf(req, callback) {
    var url = get_sf_url(req.originalUrl.substring('/sf/api'.length, req.originalUrl.length));
    request.json_post(url, req.body, req.attributes, callback);
}

/**
 * Forward a DELETE request to the SF API.
 * @param req - the original request.
 * @param callback - function(err, body)
 */
function delete_sf(req, callback) {
    var url = get_sf_url(req.originalUrl.substring('/sf/api'.length, req.originalUrl.length));
    request.json_delete(url, req.attributes, callback);
}


//
// Seasick API's
//

/**
 * Retrieve the list of hosts for the am_cert_hash's in the list.  This call batches up the list of hashes and retrieves
 * them from Seasick in a single call.  Note: This call does not merge in the tag counts or other values.
 * @param hash_list - the list of am_cert_hash criteria.
 * @param attributes - sso attributes.
 * @param callback - function(err, hosts)
 */
function get_hosts_by_hash_list(hash_list, attributes, callback) {
    var url = get_ss_url('api/v1/agent/set');

    var form = {
        hash: hash_list
    };

    request.form_post(url, form, attributes, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            if (body) {
                var o = JSON.parse(body);
                callback(null, o.objects ? o.objects : []);
            }
            else {
                callback(null, []);
            }
        }
    });
}

/**
 * Retrieve the host matching the hash value and mix in the related tag counts for each host.
 * @param hash
 * @param attributes
 * @param callback
 */
function get_host_by_hash(hash, attributes, callback) {
    get_hosts_by_hash_list([hash], attributes, function (err, objects) {
        if (err) {
            callback(err);
        }
        else if (objects.length <= 0) {
            // No values returned, return null.
            callback(null, null);
        }
        else if (objects.length == 1) {
            // OK, found the host.
            callback(null, objects[0]);
        }
        else { // (objects.length > 1) {
            // Error, two many values returned.
            callback('More than one agent returned for hash: ' + hash);
        }
    });
}

/**
 * Retrieve hosts by host name.
 * @param hostnames - a list of hostnames to search for.
 * @param attributes - sso attributes.
 * @param callback - function(err, hosts)
 */
function get_hosts_by_name(hostnames, attributes, callback) {
    var host_params = hostnames.join(',');
    var url = get_ss_url('api/v1/agent/?hostname__icontains=' + host_params);
    request.json_get(url, {}, attributes, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, body && body.objects ? body.objects : []);
        }
    });
}

/**
 * Retrieve hosts by IP.
 * @param ips - the list of ips to search for.
 * @param attributes - sso attributes.
 * @param callback - function(err, hosts)
 */
function get_hosts_by_ip(ips, attributes, callback) {
    var converted_ips = [];
    ips.forEach(function (ip) {
        try {
            converted_ips.push(api_utils.dot2num(ip));
        }
        catch (e) {
            // Error
            log.error(e.stack);
            return callback('Unable to convert ip: ' + ip);
        }
    });
    var ip_params = converted_ips.join(',');
    var url = get_ss_url('api/v1/agent/?ip__in=' + ip_params);
    request.json_get(url, {}, attributes, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, body && body.objects ? body.objects : []);
        }
    });
}

/**
 * Post an acquisition.
 * @param params - the additional acquisitions parameters to send.
 * @param attributes - sso attributes.
 * @param callback - function(err, body)
 */
function post_acquisition(params, attributes, callback) {
    // Post the acquisition.
    var url = get_ss_url(_.sprintf('clusters/%s/agents/%s/acquisitions/',
        params.cluster_uuid, params.am_cert_hash));

    request.form_post(url, params, attributes, function (err, response, json) {
        if (err) {
            // Error
            log.error(_.sprintf('Exception while submitting acquisition for cluster_uuid: %s and hash: %s',
                params.cluster_uuid, params.hash));
            log.error(err);
            callback(err);
        }
        else {
            var body = JSON.parse(json);
            if (!body.state) {
                // Error, state is invalid.
                callback('Invalid acquisition state - ' + body);
            }
            else if (body.state != 'created') {
                // Error, acquisition not submitted.
                callback('Acquisition request state was not submitted: ' + json.state);
            }
            else {
                // Ok
                var comment = _.sprintf('Acquisition (%s) FilePath: %s FileName: %s',
                    body.uuid, params.file_path, params.file_name);

                async.series(
                    [
                        function (callback) {
                            // Post process the acquisition.
                            async.parallel
                            (
                                [
                                    function (callback) {
                                        // Post the users acquisition comment if it exists.
                                        if (params.comment) {
                                            post_comment(params.rowitem_uuid, params.comment, attributes, callback);
                                        }
                                        else {
                                            callback();
                                        }
                                    },
                                    function (callback) {
                                        // Tag the row to investigating.
                                        post_tag(params.rowitem_uuid, attributes, 'investigating', callback);
                                    },
                                    function (callback) {
                                        // Associate the acquisition with the identity.
                                        uac_api.create_idenity_acquisition(params.identity,
                                                                           body.uuid,
                                                                           attributes.user_uuid,
                                                                           attributes.uid,
                                                                           callback);
                                    }
                                ],
                                function (err) {
                                    // Done.
                                    callback(err);
                                });
                        }
                    ],
                    function (err) {
                        if (err) {
                            // Error.
                            log.error(_.sprintf('Exception while processing acquisition for cluster_uuid: %s and ' +
                                'hash: %s', params.cluster_uuid, params.hash));
                            log.error(err);
                            callback(err);
                        }
                        else {
                            // OK.
                            log.info(_.sprintf('Successfully submitted acquisition request for cluster_uuid: %s and ' +
                                'hash: %s', params.cluster_uuid, params.hash));
                            callback(null, body);
                        }
                    }
                )
            }
        }
    });
}

/**
 * Add the link field to an acquisition instance.
 * @param acquisition - the acquisition.
 */
function add_acquisition_link(acquisition) {
    if (acquisition && acquisition.acquired_file) {
        acquisition.link = get_ss_url(acquisition.acquired_file);
    }
}

/**
 * Retrieve the list of acquisitions by a comma separated list of clusters.
 * @param params - todo:
 * @param attributes - sso attributes.
 * @param callback - function(err, acquisitions)
 */
function get_acquisitions(params, attributes, callback) {
    var url = get_ss_url('api/v1/acquisition/');
    if (!params || !params.order_by) {
        params.order_by = '-create_datetime';
    }
    request.json_get(url, params, attributes, function (err, response, body) {
        if (err) {
            // Error
            callback(err);
        }
        else {
            // Fill in a link value for each acquisition.
            body.objects.forEach(add_acquisition_link);

            callback(null, body);
        }
    });
}

/**
 * Retrieve acquisition details.
 * @param acquisition_uuid - the acquisition id.
 * @param attributes - the sso attributes.
 * @param callback - function(err, acquisition)
 */
function get_acquisition(acquisition_uuid, attributes, callback) {
    var url = get_ss_url(_.sprintf('api/v1/acquisition/%s/', acquisition_uuid));
    request.json_get(url, {}, attributes, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            add_acquisition_link(body);
            callback(null, body);
        }
    });
}

/**
 * Retrieve a list of acquisitions by id.
 * @param ids - a list of acquisition ids.
 * @param attributes - sso attributes.
 * @param callback - function(err, acquisitions).
 */
function get_acquisitions_by_id(ids, attributes, callback) {
    if (ids && ids.length > 0) {
        var id_params = ids.join(',');
        var url = get_ss_url(_.sprintf('api/v1/acquisition/?uuid__in=%s', id_params));
        request.json_get(url, {}, attributes, function (err, response, body) {
            if (err) {
                // Error.
                callback(err);
            }
            else {
                if (body.objects) {
                    body.objects.forEach(add_acquisition_link);
                    callback(null, body.objects);
                }
                else {
                    callback(null, []);
                }
            }
        });
    }
    else {
        // Nothing to process.
        callback(null, []);
    }
}

/**
 * Retrieve a list of acquisitions by identity.
 * @param identity - the identity.
 * @param attributes - sso attributes.
 * @param callback - function(err, acquisitions)
 */
function get_acqusitions_by_identity(identity, attributes, callback) {
    async.waterfall(
        [
            function(callback) {
                // Retrieve the list of acquisitions for the identity.
                uac_api.get_identity_acquisitions_by_identity(identity, callback);
            },
            function(identity_acquisitions, callback) {
                // Look up and return the related acquisitions.
                var acquisition_uuids = _.pluck(identity_acquisitions, 'acquisition_uuid');
                get_acquisitions_by_id(acquisition_uuids, attributes, callback);
            }
        ],
            function(err, acquisitions) {
                if (err) {
                    // Error
                    callback(err);
                }
                else {
                    // Add the acquisition link content.
                    acquisitions.forEach(add_acquisition_link);
                    callback(null, acquisitions);
                }
            }
    );
}


/**
 * Retrieve the audit related to an acquisition.
 * @param acquisition_id - the acquisition id.
 * @param attributes - request attributes.
 * @param callback - function(err, audit).  Returns null if no audit was found.
 */
function get_acquisition_audit(acquisition_id, attributes, callback) {
    var url = get_ss_url(_.sprintf('api/v1/acquisition/%s/fileitem/', acquisition_id));
    request.json_get(url, {}, attributes, function (err, response, body) {
        if (response.statusCode == 404) {
            callback(null, null);
        }
        else {
            callback(err, body);
        }
    });
}


//
// Exports
//
exports.get_sf = get_sf;
exports.post_sf = post_sf;
exports.delete_sf = delete_sf;
exports.get_services = get_services;
exports.get_clusters = get_clusters;
exports.get_services_clients_clusters = get_services_clients_clusters;

// Tags.
exports.get_tags = get_tags;
exports.get_searchable_tags = get_searchable_tags;
exports.post_tag = post_tag;

// IOC Summary.
exports.get_ioc_summary = get_ioc_summary;

// Hits.
exports.get_hits = get_hits;
exports.get_rowitem_content = get_rowitem_content;
exports.get_tag_summary_by_hash = get_tag_summary_by_hash;
exports.post_comment = post_comment;

// Tasks.
exports.get_tasks = get_tasks;

// Suppressions.
exports.get_suppression = get_suppression;
exports.get_suppressions = get_suppressions;

// Seasick.
exports.get_full_hosts_by_ip = get_full_hosts_by_ip;
exports.get_full_hosts_by_name = get_full_hosts_by_name;
exports.get_hosts_by_hash_list = get_hosts_by_hash_list;
exports.get_host_by_hash = get_host_by_hash;
exports.get_hosts_by_name = get_hosts_by_name;
exports.get_hosts_by_ip = get_hosts_by_ip;
exports.get_full_host_by_hash = get_full_host_by_hash;
exports.post_acquisition = post_acquisition;
exports.get_acquisitions = get_acquisitions;
exports.get_acquisition = get_acquisition;
exports.get_acquisitions_by_id = get_acquisitions_by_id;
exports.get_acqusitions_by_identity = get_acqusitions_by_identity;
exports.get_acquisition_audit = get_acquisition_audit;
exports.add_host_metadata = add_host_metadata;

exports.toJSON = toJSON;


//
// Utilities
//

function get_sf_url(relative_url) {
    return api_utils.combine_urls(settings.get(settings.UAC_SF_API_URL), relative_url);
}

function get_ss_url(relative_url) {
    return api_utils.combine_urls(settings.get(settings.UAC_SS_API_URL), relative_url);
}
