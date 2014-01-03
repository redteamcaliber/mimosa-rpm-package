var querystring = require('querystring');
var clone = require('clone');
var log = require('winston');
var moment = require('moment');
var async = require('async');
var _ = require('underscore.string');
var request_api = require('request');
var settings = require('settings');
var sso = require('sso');


var _ticket = undefined;
var _ticket_expiration = undefined;


if (settings.get('server:verify_ssl') === false) {
    // TODO: This seems to be a bug or issue with node or the request library.  Look into removing.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

// Patch the request library to use the default querystring stringify method.
request_api.Request.prototype.form = function (form) {
    if (form) {
        this.setHeader('content-type', 'application/x-www-form-urlencoded; charset=utf-8');
        this.body = querystring.stringify(form).toString('utf8');  // Override the default form encoding.
        return this;
    }
    // create form-data object
    this._form = new FormData();
    return this._form;
};

function get(options, attributes, callback) {
    options.method = 'GET';
    request(options, attributes, callback);
}

/**
 * Make a simple JSON get request.
 * @param url
 * @param params.
 * @param attributes.
 * @param callback.
 */
function json_get(url, params, attributes, callback) {
    var options = {
        method: 'GET',
        url: url,
        json: true,
        params: params
    };
    request(options, attributes, callback);
}

function json_post(url, body, attributes, callback) {
    var options = {
        method: 'POST',
        url: url,
        json: body
    };
    request(options, attributes, callback);
}

function form_post(url, form, attributes, callback) {
    var options = {
        method: 'POST',
        url: url,
        form: form
    };
    request(options, attributes, callback);
}

function json_delete(url, attributes, callback) {
    var options = {
        method: 'DELETE',
        url: url
    };
    request(options, attributes, callback);
}

function post(options, attributes, callback) {
    options.method = 'POST';
    request(options, attributes, callback);
}

function del(options, attributes, callback) {
    options.method = 'DELETE';
    request(options, attributes, callback);
}

function put(options, attributes, callback) {
    options.method = 'PUT';
    request(options, attributes, callback);
}

function patch(options, attributes, callback) {
    options.method = 'PATCH';
    request(options, attributes, callback);
}

/**
 * Make a request.
 * @param options - the request options.
 * @param attributes - SSO attributes (uid, data, etc).
 * @param callback - function(err, response, body)
 */
function request(options, attributes, callback) {
    var local_options = clone(options);

    var url = local_options.url ? local_options.url : local_options.uri;
    if (!url) {
        // Error, a URL was not supplied.
        return callback('"url" or "uri" is required.');
    }

    if (local_options.qs && local_options.params) {
        // Error should not specify both qs and params.
        return callback('Illegal to specify both "qs" and "params"');
    }

    if (local_options.params && Object.keys(local_options.params).length > 0) {
        // User has specified query parameters to add to the url.
        var qs = '?' + querystring.stringify(local_options.params);

        if (url.indexOf('?') != -1) {
            log.warn(_.sprintf('Request to url: %s with params: %s when url already contains a query string.',
                url, local_options.params));
        }

        if (local_options.url) {
            local_options.url += qs;
        }
        else if (local_options.uri) {
            local_options.uri += qs;
        }
        // Update the temporary url variable.
        url = local_options.url ? local_options.url : local_options.uri;
    }

    async.waterfall(
        [
            // Get an sso ticket.
            function (callback) {
                if (is_ticket_valid()) {
                    // Use the existing sso ticket.
                    callback(null, _ticket);
                }
                else {
                    // Obtain a new sso ticket.
                    get_ticket(settings.get('sso:auth_user'),
                        settings.get('sso:auth_pass'),
                        settings.get('sso:auth_url'),
                        settings.get('server:verify_ssl'),
                        callback
                    );
                }
            },
            // Make the request.
            function (ticket, callback) {
                // Obtain a cookie jar.
                var jar = local_options.jar ? local_options.jar : request_api.jar();
                var auth_cookie = request_api.cookie(
                    _.sprintf('%s=%s', settings.get('sso:auth_cookie'), encodeURIComponent(ticket)));
                // Add the auth cookie.
                jar.add(auth_cookie);
                if (!local_options.jar) {
                    local_options.jar = jar;
                }
                if (!local_options.followRedirect) {
                    local_options.followRedirect = false;
                }

                if (attributes) {
                    // Set the SSO attributes to be passed on.
                    if (!local_options.headers) {
                        local_options.headers = {};
                    }
                    local_options.headers.X_REMOTE_USER = attributes.uid;
                    local_options.headers.X_REMOTE_LOGIN = attributes.ticket;
                }

                try {
                    // Make the request.
                    log.debug('Invoking url: %s %s', local_options.method ,url);
                    var start_time = Date.now();

                    request_api(local_options, function (err, response, body) {
                        log.debug(_.sprintf('Invoked url: %s %s in %s ms', local_options.method, url, Date.now() - start_time));

                        if (err) {
                            // Unknown error.
                            if (body) {
                                log.error(body)
                            }
                            callback(_.sprintf('Unknown error while invoking url: %s %s - %s',
                                local_options.method, url, err));
                        }
                        else if (response.statusCode == 200) {
                            // Response is good.
                            callback(null, response, body);
                        }
                        else {
                            // Return an error indicating that the the response was not a 200.  The response and body
                            // are still passed along for inspection downstream.
                            var body_content;
                            try {
                                body_content = body ? JSON.stringify(body) : undefined;
                            }
                            catch (e) {
                                // Unable to process body content.
                                log.warn(e);
                                body_content = body
                            }
                            var error_message = _.sprintf('Url: %s returned bad http status code: %s - %s',
                                url, response.statusCode, body_content);
                            callback(error_message, response, body);
                        }
                    });
                }
                catch (e) {
                    // Error
                    callback(_.sprintf('Exception while making request for url: %s - %s\n%s', url, e, e.stack));
                }
            }
        ],
        // Invoke the callback.
        function (err, response, body) {
            // Return the result.
            callback(err, response, body);
        }
    );
}

/**
 * Retrieve an SSO ticket.
 * @param user
 * @param pass
 * @param url
 * @param verify_ssl
 * @param callback
 *
 * SSO API result values:
 *     result = 0   Failure
 *              1   Success
 *              2   Success, but requires second factor code
 *     message = Human readable message
 *     otp_session: Session (if second factor is required)
 *     code = 0  no additional details
 *            1  app access only (no longer used)
 *            2  Bad parameters or bad JSON
 *            3  Error occurred
 *            4  Unused
 *            5  Unused
 *            6  Unauthorized IP
 */
function get_ticket(user, pass, url, verify_ssl, callback) {
    var params = _.sprintf('{"uid":"%s","password":"%s"}', user, pass);

    log.info('Obtaining a new ticket from sso...');

    request_api({
        url: url,
        method: 'POST',
        body: params,
        rejectUnauthorized: verify_ssl
    }, function (err, response, body) {
        if (err) {
            // Request error.
            callback(_.sprintf('Exception while retrieving sso ticket for user: %s - %s', user, err));
        }
        else {
            // Parse the SSO response.
            var data = JSON.parse(body);
            if (data.result == 1 && data.ticket) {
                try {
                    var ticket_data = parse_ticket_sync(data.ticket);
                    // Update the ticket references.
                    _ticket = data.ticket;

                    if (ticket_data.graceperiod && ticket_data.graceperiod < ticket_data.validuntil) {
                        _ticket_expiration = ticket_data.graceperiod;
                    }
                    else {
                        _ticket_expiration = ticket_data.validuntil;
                    }

                    log.info('Sucessfully obtained sso ticket, expiration: ' + moment.unix(_ticket_expiration).format());

                    // Found a valid response, return the ticket.
                    callback(undefined, _ticket);
                }
                catch (e) {
                    // Error
                    callback(_.sprintf('Exception while obtaining sso ticket - %s\n%s', e, e.stack));
                }
            }
            else {
                // Error, invalid response code, obtain a message.
                callback(_.sprintf('Error: Bad result code when obtaining sso ticket - %s', data.message));
            }
        }
    });
}

/**
 * Optimized parse ticket routine with minimal error checking since the tickets are coming directly from sso.
 * @param ticket - the ticket.
 * @return {*} a dictionary of the ticket parts or null if the ticket could not be parsed.
 */
function parse_ticket_sync(ticket) {
    // Find the ticket signature.
    var sig_index = ticket.indexOf(';sig');
    var ticket_data = {};

    // Split the data and sig portions of the ticket.
    ticket_data.data = ticket.substring(0, sig_index);
    ticket_data.sig = ticket.substring(sig_index + 5, ticket.length);

    // Tokenize the data portion of the ticket.
    var tokens = ticket_data.data.split(';');
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var equals_index = token.indexOf('=');
        var key = token.substring(0, equals_index);
        // Add the pair to the ticket data.
        ticket_data[key] = token.substring(equals_index + 1, token.length);
    }
    return ticket_data;
}

/**
 * Return whether the cached ticket is valid.
 * @returns {undefined|boolean} - true if the cached ticket is valid.
 */
function is_ticket_valid() {
    return _ticket && moment().unix() < _ticket_expiration;
}

exports.request = request;
exports.get = get;
exports.json_get = json_get;
exports.json_post = json_post;
exports.form_post = form_post;
exports.json_delete = json_delete;
exports.post = post;
exports.put = put;
exports.del = del;
exports.patch = patch;
