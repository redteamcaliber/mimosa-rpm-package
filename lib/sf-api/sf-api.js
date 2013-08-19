var async = require('async');
var _ = require('underscore.string');
var moment = require('moment');
var request = require('m-request');
var settings = require('settings');
var log = require('log');
var route_utils = require('route-utils');


/**
 * Retrieve the list of MCIRT services.
 * @param req - the request.
 * @param callback - function(err, services)
 */
function get_services(req, callback) {
    var url = get_sf_url('services');
    request.json_get(req, url, {}, function (err, response, body) {
        callback(err, body);
    });
}

function get_clusters(req, callback) {
    var url = get_sf_url('clusters');
    request.json_get(req, url, {}, function (err, response, body) {
        callback(err, body);
    });
}

function get_usersettings(req, callback) {
    var url = get_sf_url('usersettings');
    request.json_get(req, url, {}, function (err, response, body) {
        callback(err, body);
    });
}

function delete_usersettings(req, callback) {
    request.json_delete(req, get_sf_url('usersettings'), function(err, response, body) {
        callback(err, body);
    });
}

function get_tags(req, callback) {
    var url = get_sf_url('tags');
    request.json_get(req, url, {}, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Retrieve the list of tag values that can be seached on.
 * callback - function(err, tags)
 */
function get_searchable_tags(req, callback) {
    var url = get_sf_url('tags');
    request.json_get(req, url, {}, function (err, response, body) {
        var results = [];
        body.forEach(function (tag) {
            if (tag.name != 'notreviewed') {
                results.push(tag);
            }
        });
        callback(err, results);
    });
}

function get_ioc_summary(req, params, callback) {
    var url = get_sf_url('ioc-summary');
    request.json_get(req, url, params, function(err, response, body) {
        callback(err, body);
    })
}

/**
 * Retrieve the list of hits for the specified tagname.
 * @param req - the original request.
 * @param tagname - the tagname to filter on.
 * @param callback - function(err, response, body).
 */
function get_hits_by_tagname(req, tagname, callback) {
    var url = get_sf_url('hits?limit=0&tagname=' + tagname);
    request.json_get(req, url, {}, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Retrieve the tag summary counts for a host.
 * @param req - the original request.
 * @param am_cert_hash - the host to match.
 * @param callback - function(err, response, body).
 */
function get_tag_summary_by_hash(req, am_cert_hash, callback) {
    var url = get_sf_url('tag-summary?am_cert_hash=%s' + am_cert_hash);
    request.json_get(req, url, {}, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Post a tag to a row.
 * @param req - the request.
 * @param rowitem_uuid - the row.
 * @param tagname - the tag.
 * @param callback - function(err, body)
 */
function post_tag(req, rowitem_uuid, tagname, callback) {
    var body = {
        tagname: tagname
    };
    var url = get_sf_url(_.sprintf('hits/%s/settag', rowitem_uuid));
    request.json_post(req, url, body, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Post a comment to a row.
 * @param req - the request.
 * @param rowitem_uuid - the row.
 * @param comment - the comment.
 * @param callback - function(err, body)
 */
function post_comment(req, rowitem_uuid, comment, callback) {
    var body = {
        'comment': comment,
        'token': 'NA',
        'type': 'default'
    };
    var url = get_sf_url(_.sprintf('hits/%s/addcomment', rowitem_uuid));
    request.json_post(req, url, body, function (err, response, body) {
        callback(err, body);
    });
}

/**
 * Process the hosts adding counts and host metadata to each item.
 * @param req - the request instance.
 * @param hosts - the list of hosts.
 * @param callback - function(err, hosts)
 */
function process_hosts(req, hosts, callback) {
    async.each(
        hosts,
        function (host, callback) {
            get_tag_summary_by_hash(req, host.hash, function (err, counts) {
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
    now = moment();
    last_2_hours = now.subtract('hours', 2);
    last_24_hours = now.subtract('hours', 24);
    last_48_hours = now.subtract('hours', 48);

    hosts.forEach(function (host) {
        if (host.time_logged) {
            // Add the time metadata.
            var time_logged = moment(host.time_logged, 'YYYY-MM-DDTHH:mm:ss Z');
            host.time_formatted = time_logged.format('YYYY-MM-DD HH:mm:ss');
            if (now.isAfter(last_2_hours) || now.isSame(last_2_hours)) {
                host.time_caption = 'Within 2 Hours';
                host.time_label = 'success';
            }
            else if (now.isAfter(last_24_hours) || now.isSame(last_24_hours)) {
                host.time_caption = 'Within 24 Hours';
                host.time_label = 'info';
            }
            else if (now.isAfter(last_48_hours) || now.isSame(last_48_hours)) {
                host.time_caption = 'Within 48 Hours';
                host.time_label = 'warning';
            }
            else {
                host.time_caption = 'More Than 48 Hours';
                host.time_label = 'important';
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
 *
 * @param req
 * @param hash
 * @param callback
 */
function get_full_host_by_hash(req, hash, callback) {
    async.waterfall(
        [
            function (callback) {
                get_host_by_hash(req, hash, callback);
            },
            function (host, callback) {
                if (host) {
                    process_hosts(req, [host], callback);
                }
                else {
                    // TODO: This needs to be cleaned up.  Some hosts are not in SS.
                    callback(null, [
                        {}
                    ]);
                }
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
 * @param req
 * @param ips
 * @param callback
 */
function get_full_hosts_by_ip(req, ips, callback) {
    async.waterfall(
        [
            function (callback) {
                // Retrieve the hosts by ip address.
                get_hosts_by_ip(req, ips, callback);
            },
            function (hosts, callback) {
                process_hosts(req, hosts, callback);
            }
        ],
        function (err, hosts) {
            callback(err, hosts);
        }
    );
}

/**
 * Retrieve the matching hosts for the list of hostnames and mix in the related tag counts for each host.
 * @param req
 * @param hostnames
 * @param callback
 */
function get_full_hosts_by_name(req, hostnames, callback) {
    async.waterfall(
        [
            function (callback) {
                get_hosts_by_name(req, hostnames, callback);
            },
            function (hosts) {
                // For each of the hosts look up the tag counts and add metadata.
                process_hosts(req, hosts, callback);
            }
        ],
        function (err, hosts) {
            callback(err, hosts);
        }
    );
}


//
// Seasick API's
//

/**
 * Retrieve the list of hosts for the am_cert_hash's in the list.  This call batches up the list of hashes and retrieves
 * them from Seasick in a single call.  Note: This call does not merge in the tag counts or other values.
 * @param req - the request.
 * @param hash_list - the list of am_cert_hash criteria.
 * @param callback - function(err, hosts)
 */
function get_hosts_by_hash_list(req, hash_list, callback) {
    var param = hash_list.join(';');
    var url = get_ss_url(_.sprintf('api/v1/agent/set/%s/', param));
    request.json_get(req, url, {}, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, body.objects ? body.objects : []);
        }
    });
}

/**
 * Retrieve the host matching the hash value and mix in the related tag counts for each host.
 * @param req
 * @param hash
 * @param callback
 */
function get_host_by_hash(req, hash, callback) {
    get_hosts_by_hash_list(req, [hash], function (err, objects) {
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

function get_hosts_by_name(req, hostnames, callback) {
    var host_params = hostnames.join(',');
    var url = get_ss_url('api/v1/agent/?hostname__in=' + host_params);
    request.json_get(req, url, {}, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, body && body.objects ? body.objects : []);
        }
    });
}

function get_hosts_by_ip(req, ips, callback) {
    var converted_ips = [];
    ips.forEach(function (ip) {
        try {
            converted_ips.push(dot2num(ip));
        }
        catch (e) {
            // Error
            return callback('Unable to convert ip: ' + ip);
        }
    });
    var ip_params = converted_ips.join(',');
    var url = get_ss_url('api/v1/agent/?ip__in=' + ip_params);
    request.json_get(req, url, {}, function (err, response, body) {
        if (err) {
            callback(err);
        }
        else {
            callback(null, body && body.objects ? body.objects : []);
        }
    });
}

function post_suppression(req, body, callback) {
    request.json_post(req, get_sf_url('suppressions'), body, function(err, response, body) {
        if (err) {
            // Error
            callback(err);
        }
        else {
            callback(null, body);
        }
    });
}

/**
 * Post an acquisition.
 * @param req - the request.
 * @param cluster_uuid - the acquisition cluster.
 * @param hash - the host.
 * @param params - the additional acquisitions parameters to send.
 * @param callback - function(err, body)
 */
function post_acquisition(req, cluster_uuid, hash, params, callback) {
    async.waterfall(
        [
            function (callback) {
                // Post the acquisition.
                var url = get_ss_url(_.sprintf('clusters/%s/agents/%s/acquisitions/',
                    cluster_uuid, params.am_cert_hash));
                request.json_post(req, url, params, callback);
            },
            function (response, body, callback) {
                if (!body.state) {
                    // Error.
                    callback('Invalid return state from seasick.');
                }
                else if (body.state != 'submitted') {
                    // Error
                    callback('State was not submitted: ' + body.state);
                    callback(null);
                }
                else {
                    callback(null, body);
                }
            },
            function (body, callback) {
                if (!params.rowitem_uuid) {
                    // Error
                    callback('"rowitem_uuid" is undefined, unable to write comment/tag.');
                }

                var comment = _.sprintf('Acquisition (%s) FilePath: %s FileName: %s',
                    body.uuid, params.file_name, params.file_path);
                post_comment(req, params.rowitem_uuid, comment, function (err) {
                    err ? callback(err) : callback(null, body);
                });
            },
            function (body, callback) {
                // Tag the row.
                post_tag(req, params.rowitem_uuid, 'investigating', function (err) {
                    err ? callback(err) : callback(null, body);
                });
            }
        ],
        function (err, acquisition_body) {
            if (err) {
                // Error.
                log.error(_.sprintf('Exception while submitting acquisition for cluster_uuid: %s and hash: %s',
                    cluster_uuid, hash));
                log.error(err);
                callback(err);
            }
            else {
                // OK.
                log.info(_.sprintf('Successfully submitted acquisition request for cluster_uuid: %s and hash: %s',
                    cluster_uuid, hash));
                callback(null, acquisition_body)
            }
        }
    );
}


//
// Exports
//
exports.get_services = get_services;
exports.get_clusters = get_clusters;
exports.get_usersettings = get_usersettings;
exports.delete_usersettings = delete_usersettings;
exports.get_tags = get_tags;
exports.get_searchable_tags = get_searchable_tags;
exports.get_ioc_summary = get_ioc_summary;
exports.get_hits_by_tagname = get_hits_by_tagname;
exports.get_tag_summary_by_hash = get_tag_summary_by_hash;
exports.get_full_hosts_by_ip = get_full_hosts_by_ip;
exports.get_full_hosts_by_name = get_full_hosts_by_name;
exports.get_hosts_by_hash_list = get_hosts_by_hash_list;
exports.get_host_by_hash = get_host_by_hash;
exports.get_hosts_by_name = get_hosts_by_name;
exports.get_hosts_by_ip = get_hosts_by_ip;
exports.get_full_host_by_hash = get_full_host_by_hash;
exports.post_tag = post_tag;
exports.post_comment = post_comment;
exports.post_acquisition = post_acquisition;
exports.post_suppression = post_suppression;


//
// Utilities
//

function get_sf_url(relative_url) {
    return route_utils.combine_urls(settings.get(settings.UAC_SF_API_URL), relative_url);
}

function get_ss_url(relative_url) {
    return route_utils.combine_urls(settings.get(settings.UAC_SS_API_URL), relative_url);
}

function dot2num(dot) {
    var d = dot.split('.');
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
}

function num2dot(num) {
    var d = num % 256;
    for (var i = 3; i > 0; i--) {
        num = Math.floor(num / 256);
        d = num % 256 + '.' + d;
    }
    return d;
}
