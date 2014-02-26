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
 * Construct an M-Cube full url from a relative url.
 * @param relative_url - the relative m-cube url.
 * @returns {String} - the full url.
 */
function get_mcube_url(relative_url) {
    return api_utils.combine_urls(settings.get('uac:mcube_api_url'), relative_url);
}

/**
 *
 * @param md5
 * @param callback
 */
function get_md5_details(md5, callback) {
    var url = get_mcube_url(_.sprintf('/vtapi/v2/file/report/', md5));

    var options = {
        url: url,
        json: true,
        headers: {
            'X-Authentication': settings.get('uac:mcube_api_key')
        }
    };
    request.get(options, {}, callback);
}


exports.get_ioc_terms = get_ioc_terms;
exports.create_idenity_acquisition = create_identity_acquisition;
exports.delete_identity_acquisition = delete_identity_acquisition;
exports.get_identity_acquisitions_by_identity = get_identity_acquisitions_by_identity;
exports.get_identity_acquisitions_by_user_uuid = get_identity_acquisitions_by_user_uuid;
exports.get_md5_details = get_md5_details;