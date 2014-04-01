/**
 * Mandiant Express JS SSO Middleware.
 */

var crypto = require('crypto');
var fs = require("fs");

var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var moment = require('moment');
var log = require('winston');

// The data keys that must be present in an SSO ticket.
var REQUIRED_TICKET_KEYS = ['uid', 'validuntil', 'tokens', 'udata', 'graceperiod', 'data', 'sig'];

/**
 * Load a key file.
 * @param key_file - the file name.
 * @returns the contents of the file.
 */
function load_key(key_file) {
    var pubkey = fs.readFileSync(key_file, 'utf8');

    // Don't include the comments in the certificate.
    var index = pubkey.indexOf('--');
    if (index != -1) {
        pubkey = pubkey.substring(index, pubkey.length);
    }

    return pubkey
}

/**
 * Parse the raw ticket into a dictionary of values.  Invokes the callback with the first parameter being an error
 * value if the ticket is not able to be parsed.
 * @param ticket - the raw ticket.
 * @throws Error if there is an issue parsing the ticket.
 */
function parse_ticket(ticket) {
    if (!ticket) {
        // Error
        throw 'Empty ticket found while parsing ticket.';
    }

    // Find the ticket signature.
    var sig_index = ticket.indexOf(';sig');
    if (sig_index == -1) {
        // Error, the ticket signature is missing.
        throw _.sprintf('Ticket signature is missing while parsing ticket: %s', ticket);
    }

    // Result value.
    var ticket_data = {};

    // Split the data and sig portions of the ticket.
    ticket_data.data = ticket.substring(0, sig_index);
    ticket_data.sig = ticket.substring(sig_index + 5, ticket.length);

    // Tokenize the data portion of the ticket.
    var tokens = ticket_data.data.split(';');
    for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        var pair = split_pair(token);
        if (pair) {
            // Add the pair to the ticket data.
            ticket_data[pair.key] = pair.val;
        }
        else {
            // Error, unable to parse ticket data.
            throw _.sprintf('Unable to parse ticket data token: %s', token);
        }
    }

    // Ensure the ticket contains the required keys.
    REQUIRED_TICKET_KEYS.forEach(function(required) {
        if (!(required in ticket_data)) {
            // Error, ticket data is missing key.
            throw 'Ticket data is missing key: ' + required;
        }
    });

    return ticket_data;
}

/**
 * Validate the signature of the ticket data.
 * @param pubkey - the public key to use during validation.
 * @param ticket_data - a dictionary of ticket data.
 * @returns {boolean} - true if the signature is valid.
 */
function is_signature_valid(pubkey, ticket_data) {
    try {
        var verifier = crypto.createVerify('RSA-SHA1');
        verifier.update(ticket_data.data);
        return verifier.verify(pubkey, ticket_data.sig, 'base64');
    }
    catch (e) {
        // Error
        log.error('Exception while validating signature - ' + e);
        log.error(e.stack);
        return false;
    }
}

function is_auth_token_valid(auth_token, ticket_data) {
    try {
        if (auth_token) {
            // Auth token is required.
            var user_app_tokens;
            if (ticket_data.tokens) {
                // User has auth tokens assigned to them.
                user_app_tokens = ticket_data.tokens.split(',');

                // Ensure the user has the required auth token.
                if (_.indexOf(user_app_tokens, auth_token) != -1) {
                    log.debug(_.sprintf('User: %s has authtoken: %s', ticket_data.uid, auth_token));
                    return true;
                }
                else {
                    // Log the failure.
                    log.warn(_.sprintf('User: %s attempting access to UAC but does not have required authtoken: %s',
                        ticket_data.uid, auth_token));
                    return false;
                }
            }
            else {
                // No user token data found.
                log.warn('No user tokens found for user: ' + ticket_data.uid);
                return false
            }
        }
        else {
            // No auth tokens required.
            log.debug('No auth tokens are configured.');
            return true;
        }
    }
    catch (e) {
        // Error
        log.error('Exception while validating app token - ' + e);
        log.error(e.stack);
        return false;
    }
}

/**
 * Validate the ticket grace period date..
 * @param ticket_data - a dictionary of ticket data.
 * @returns {boolean} - true if the grace period has expired.
 */
function is_grace_period_expired(ticket_data) {
    try {
        return moment().unix() > ticket_data.graceperiod;
    }
    catch (e) {
        // Error
        log.error(_.sprintf('Exception while validating ticket grace period until date: %s - %s',
            ticket_data.graceperiod, e));
        log.error(e.stack);
        return false;
    }
}

/**
 * Validate the ticket valid until date.
 * @param ticket_data - a dictionary of ticket data.
 * @returns {boolean} - true if the ticket has expired.
 */
function is_ticket_expired(ticket_data) {
    try {
        return moment().unix() > ticket_data.validuntil;
    }
    catch (e) {
        // Error
        log.error(_.sprintf('Exception while validating ticket valid until date: %s - %s', ticket_data.validuntil, e));
        log.error(e.stack);
        return false;
    }
}

/**
 * Split a key value pair string.
 * @param kv - the key value pair in the format "key=value".
 * @returns (*) an object containing a key and value or undefined if the kv cannot be parsed.
 */
function split_pair(kv) {
    if (kv) {
        var index = kv.indexOf('=');
        var key = kv.substring(0, index);
        var val = kv.substring(index + 1, kv.length);
        return {
            key: key,
            val: val
        }
    }
    else {
        return undefined;
    }
}

/**
 * Construct the login url for the main login page.
 * @param req - a request instance.
 * @param settings - the sso settings.
 * @returns {*} - the login url.
 */
function get_login_url(req, settings) {
    try {
        var base_url = settings.login_url;
        // The login url should always be https.
        var back_url = _.sprintf('%s://%s%s', 'https', req.host, req.url);
        return _.sprintf('%s?back=%s', base_url, encodeURIComponent(back_url));
    }
    catch (e) {
        log.warn('Exception while constructing login url: ' + e.stack);
        return settings.login_url;
    }
}

/**
 * Construct the refresh url.
 * @param req - the request.
 * @param settings - the sso settings.
 * @returns String - the refresh url.
 */
function get_refresh_url(req, settings) {
    try {
        var base_url = settings.refresh_url;
        // The login url should always be https.
        var back_url = _.sprintf('%s://%s%s', 'https', req.host, req.url);
        return _.sprintf('%s?back=%s', base_url, encodeURIComponent(back_url));
    }
    catch (e) {
        log.warn('Exception while constructing refresh url: ' + e.stack);
        return settings.login_url;
    }
}

/**
 * Either redirect the user to the login page or if the request is an XHR send the user a 401 error.  If this is a
 * ticket refresh attempt then redirect the user to the refresh page.  This should only be done if the request is not
 * an XHR request.
 * @param req - the request.
 * @param res - the response.
 * @param settings - the settings.
 */
function send_login(req, res, settings) {
    if (is_html_request(req)) {
        res.redirect(get_login_url(req, settings));
    }
    else {
        res.send(401, 'No SSO ticket found.');
    }
}

function send_refresh(req, res, settings) {
    res.redirect(get_refresh_url(req, settings));
}

/**
 * Either redirect the user to the login page or if the request is an XHR send the user a 401 error.  If this is a
 * ticket refresh attempt then redirect the user to the refresh page.  This should only be done if the request is not
 * an XHR request.
 * @param req - the request.
 * @param res - the response.
 * @param settings - the settings.
 */
function send_unauth(req, res, settings) {
    if (is_html_request(req)) {
        res.redirect(settings.unauth_url);
    }
    else {
        res.send(403, 'User is unauthorized to view this content.');
    }
}

/**
 * SSO middleware that requires the request to have a valid SSO ticket.
 * @returns {Function} - the SSO middleware function.
 */
function require_authentication(settings) {
    if (!settings) {
        log.warn('require_authentication passed empty settings parameter.');
    }

    try {
        var pubkey_setting = settings.pubkey;
        // Load the sso public key.
        log.info('Loading sso public key file: ', pubkey_setting);
        var pubkey = load_key(pubkey_setting);
    }
    catch (e) {
        // Error loading public key.
        throw 'Unable to load sso public key file: ' + settings.pubkey;
    }

    /**
     * The middleware function.
     */
    return function (req, res, next) {
        if (!settings.auth_cookie) {
            next(new Error(_.sprintf('Error: %s setting is not valid.', 'auth_cookie')));
        }
        else if (!settings.auth_url) {
            next(new Error(_.sprintf('Error: %s setting is not valid.', 'auth_url')));
        }
        else if (!req.cookies) {
            next(new Error('Cookies middleware is not enabled.'));
        }
        else if (!req.cookies[settings.auth_cookie]) {
            // No sso cookie found, redirect to the login page.
            send_login(req, res, settings);
        }
        else {
            // Auth cookie was found, validate its value.
            var ticket = req.cookies[settings.auth_cookie];

            try {
                // Parse the ticket data.
                var ticket_data = parse_ticket(ticket);

                if (req.session && req.session.sso && req.session.sso.uid != ticket_data.uid) {
                    // Error, session user does not match the ticket data, send to unauthorized page.
                    log.error('UID session mismatch error.  Session: %s, Ticket: %s', req.session.sso.uid, ticket_data.uid);
                    send_unauth(req, res, settings);
                }
                else if (!is_signature_valid(pubkey, ticket_data)) {
                    // Error, the ticket signature is not valid.
                    next(new Error(_.sprintf('Invalid ticket signature for user: %s', ticket_data.uid)))
                }
                else if (is_ticket_expired(ticket_data)) {
                    // Ticket has expired, send the user to the login view.
                    send_login(req, res, settings);
                }
                else if (!is_auth_token_valid(settings.auth_token, ticket_data)) {
                    // User is not authorized, send the user to the unauthorized view.
                    send_unauth(req, res, settings);
                }
                else if (is_grace_period_expired(ticket_data) && is_get_request(req) && is_html_request(req)) {
                    // Grace period has expired, this is a GET web request from a browser, refresh the ticket.
                    send_refresh(req, res, settings);
                }
                else {
                    // OK.

                    log.debug(_.sprintf('Validated ticket on url: %s for uid: %s, graceperiod: %s, ' +
                        '   validuntil: %s - now: %s',
                        req.originalUrl,
                        ticket_data.uid,
                        moment.unix(ticket_data.graceperiod),
                        moment.unix(ticket_data.validuntil),
                        moment()));

                    if (!req.session.sso) {
                        // Store the users sso highlights in the session for later usage.
                        var sso_attributes = {};

                        sso_attributes.uid = ticket_data.uid;

                        var udata_json = new Buffer(ticket_data.udata, 'base64').toString('utf8');
                        sso_attributes.user_uuid = JSON.parse(udata_json).uuid;

                        sso_attributes.tokens = ticket_data.tokens;

                        req.session.sso = sso_attributes;
                    }

                    // Store the SSO attributes on the request.  This is currently only needed because it is
                    // not desirable to store the users actual ticket in the session.
                    var attributes = {};
                    attributes.uid = req.session.sso.uid;
                    attributes.user_uuid = req.session.sso.user_uuid;
                    attributes.ticket = ticket;
                    req.attributes = attributes;

                    // Continue to the next layer.
                    next();
                }
            }
            catch (err) {
                // Error parsing the ticket.
                next(new Error('Exception while parsing sso ticket: ' + err));
            }
        }
    }
}

/**
 * Return whether the request is coming from a browswer.
 * @param req - the request.
 * @returns {boolean} - true if the request is from a browswer, false otherwise.
 */
function is_html_request(req) {
    return req.accepted && req.accepted.length > 0 && req.accepts('html') && !req.xhr;
}

/**
 * Return whether the request is an HTTP GET request.
 * @param req - the request.
 * @returns - true if the request is a GET request, false otherwise.
 */
function is_get_request(req) {
    return req.method == 'GET';
}

exports.parse_ticket = parse_ticket;
exports.validate = is_signature_valid;
exports.require_authentication = require_authentication;


