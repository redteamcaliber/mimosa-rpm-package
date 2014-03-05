var _ = require('underscore.string');
var pg = require('pg');
var log = require('winston');

// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());


var settings = require('settings');
var api_utils = require('api-utils');
var request = require('m-request');

// The bookshelf library instance.
var bookshelf_lib = require('bookshelf');


// Initialize the bookshelf instance.
var Bookshelf = bookshelf_lib.initialize({
    //debug: true,
    client: 'postgres',
    connection: {
        host: settings.get('uac:db_host'),
        user: settings.get('uac:db_user'),
        password: settings.get('uac:db_pass'),
        database: settings.get('uac:db_name'),
        charset: 'utf8'
    },
    pool: {
        //destroy  : function(client) { client.end(); },
        max: 10,
        // optional. if you set this, make sure to drain() (see step 3)
        min: 2,
        // specifies how long a resource can stay idle in pool before being removed
        idleTimeoutMillis: 30000,
        // if true, logs via console.log - can also be a function
        log: false
    }
});


// A local knex query builder reference.
var knex = Bookshelf.knex;


/**
 * Model class for an IOC term.
 */
var IOCTermModel = Bookshelf.Model.extend({
    tableName: 'iocterms',
    idAttribute: 'uuid'
});

/**
 * Model class for a collection of IOC terms.
 */
var IOCTermCollection = Bookshelf.Collection.extend({
    model: IOCTermModel
});

/**
 * Model class for a identity acquisition relationship.
 */
var IdentityAcquisitionModel = Bookshelf.Model.extend({
    tableName: 'identity_acquisitions',
    idAttribute: 'uuid'
});

var IdentityAcquisitionCollection = Bookshelf.Collection.extend({
    model: IdentityAcquisitionModel
});

/**
 * Retrieve the IOC terms related to type.
 * @param type - the type criteria.
 * @param callback - function(err, terms).
 */
get_ioc_terms = function (type, callback) {
    api_utils.find_all_by_criteria(IOCTermCollection, {text_prefix: type}, {}, callback);
};

/**
 * Create a relationship between an identity and an acquisition.
 * @param identity - the identity.
 * @param acquisition_uuid - the acquisition.
 * @param user_uuid - the user.
 * @param callback - function(err, model).
 */
function create_identity_acquisition(identity, acquisition_uuid, user_uuid, uid, callback) {
    api_utils.create(IdentityAcquisitionModel, {
        identity: identity,
        acquisition_uuid: acquisition_uuid,
        user_uuid: user_uuid,
        uid: uid
    }, callback);
}

/**
 * Delete an identity acquisition relationship by id.
 * @param uuid - the uuid of the identity acquisition record.
 * @param callback - function(err, model).
 */
function delete_identity_acquisition(uuid, callback) {
    api_utils.destroy(IdentityAcquisitionModel, uuid, callback);
}

/**
 * Retrieve all acquisitions for an identity.
 * @param identity - the identity criteria.
 * @param callback - function(err, collection).
 */
function get_identity_acquisitions_by_identity(identity, callback) {
    if (identity) {
        api_utils.find_all_by_criteria(IdentityAcquisitionCollection, {
            identity: identity
        }, {}, callback);
    }
    else {
        callback(null, new Bookshelf.Collection([]));
    }
}

/**
 * Retrieve all acquisitions for a user.
 * @param user_uuid - the users id.
 * @param callback - function(err, collection).
 */
function get_identity_acquisitions_by_user_uuid(user_uuid, callback) {
    api_utils.find_all_by_criteria(IdentityAcquisitionCollection, {
        user_uuid: user_uuid
    }, {}, callback);
}

/**
 * Retrieve the virus total details for the MD5.
 * @param md5 - the md5.
 * @param callback - function(err, result).
 */
function get_vt_details(md5, callback) {
    var url_base = settings.get('uac:mcube_api_url');
    var auth_key = settings.get('uac:mcube_api_key');
    var timeout  = settings.get('uac:mcube_api_timeout');

    var url = api_utils.combine_urls(url_base, _.sprintf('/vtapi/v2/file/report?md5=%s', md5));
    // Request settings.
    var options = {
        url: url,
        json: true,
        headers: {
            'X-Authentication': auth_key
        },
        timeout: timeout ? timeout : 1000
    };

    // Make the call.
    request.get(options, {}, function(err, response, body) {
        if (err) {
            // Error.
            callback(err);
        }
        else if (body && body.results && Array.isArray(body.results) && body.results.length == 1) {
            // There is a result from the API.
            //console.log(JSON.stringify(body, null, 4));

            // Parse the result.
            var detected_count = 0;
            var first_element = body.results[0];
            if (first_element.vt) {
                var keys = _.keys(first_element.vt);

                keys.forEach(function(key) {
                    var value = first_element.vt[key];
                    value.antivirus = key;
                    if (value.detected) {
                        detected_count++;
                    }
                });

                // Debug
                log.debug('MD5: %s was detected %s out of %s', md5, detected_count, keys.length);

                callback(null, {
                    md5: first_element.md5,
                    sha1: first_element.sha1,
                    found: true,
                    is_detected: detected_count > 0,
                    detected_count: detected_count,
                    count: keys.length,
                    detected: _.values(first_element.vt),
                    updated: first_element.vt_updated
                });
            }
            else {
                // Result not found.
                callback(null, {
                    md5: first_element.md5,
                    found: true,
                    is_detected: false
                });
            }
        }
        else {
            callback();
        }
    });
}

/**
 * Retrieve the details related to MD5.
 * @param md5
 * @param callback
 */
function get_md5_details(md5, callback) {
    // m-cube is configured.
    get_vt_details(md5, function(err, vt_result) {
        callback(null, {
            vt_err: err,
            vt: vt_result
        });
    });
}


exports.get_ioc_terms = get_ioc_terms;
exports.create_idenity_acquisition = create_identity_acquisition;
exports.delete_identity_acquisition = delete_identity_acquisition;
exports.get_identity_acquisitions_by_identity = get_identity_acquisitions_by_identity;
exports.get_identity_acquisitions_by_user_uuid = get_identity_acquisitions_by_user_uuid;
exports.get_vt_details = get_vt_details;
exports.get_md5_details = get_md5_details;