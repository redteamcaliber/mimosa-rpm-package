/**
 *  API Utilities.
 */


// Setup underscore.
var _ = require('underscore');
_.str = require('underscore.string');
_.mixin(_.str.exports());

var uuid = require('node-uuid');


/**
 * Bookshelf ORM Utilities.
 */

/**
 * Create an entity.
 * @param Entity - the entity class.
 * @param values - the values for the new entity.
 * @param callback - function(err, model).
 */
function create(Entity, values, callback) {
    Entity.forge(values).save({uuid: get_uuid()}).then(
        function (model) {
            callback(null, model);
        },
        function (err) {
            callback(err);
        });
}

/**
 * Update an entity.
 * @param Entity - the entity class.
 * @param values - the values for the entity.
 * @param callback - function(err, model).
 */
function update(Entity, values, callback) {
    Entity.forge(values).save({uuid: get_uuid()}).then(
        function (model) {
            callback(null, model);
        },
        function (err) {
            callback(err);
        });
}

/**
 * Destroy an entity.
 * @param Entity - the entity class.
 * @param uuid - the id of the model.
 * @param callback - function(err, model).
 */
function destroy(Entity, uuid, callback) {
    Entity.forge({uuid: uuid}).destroy().then(
        function (model) {
            callback(null, model);
        },
        function (err) {
            callback(err);
        });
}

/**
 * Retrieve all models for a collection.
 * @param Collection - the collection class.
 * @param options - options to supply to bookshelf (relationships, etc).
 * @param callback - function(err, collection).
 */
function find_all(Collection, options, callback) {
    find_all_by_criteria(Collection, {}, options, callback);
}

function find_all_by_criteria(Collection, critera, options, callback) {
    Collection.forge(critera).fetch(options).then(
        function (collection) {
            callback(null, collection);
        },
        function (err) {
            callback(err);
        });
}

/**
 * Find a single entity by id.  Returns null if the entity is not found.
 * @param Entity - the entity class.
 * @param uuid - the entity id.
 * @param options - options passed to the ORM.
 * @param callback - function(err, entity).
 */
function find(Entity, uuid, options, callback) {
    var e = Entity.forge({uuid: uuid});
    var success = function (model) {
        callback(null, model);
    };
    var error = function (err) {
        callback(err);
    };
    if (options) {
        e.fetch(options).then(success, error);
    }
    else {
        e.fetch().then(success, error);
    }
}

/**
 * Find a single entity by the specified criteria.  Returns null if the entity is not found.
 * @param Entity - the entity class.
 * @param criteria - the query criteria.
 * @param options - options passed to the ORM.
 * @param callback - function(err, entity).
 */
function find_by_criteria(Entity, criteria, options, callback) {
    var e = Entity.forge(criteria);
    var success = function (model) {
        callback(null, model);
    };
    var error = function (err) {
        callback(err);
    };
    if (options) {
        e.fetch(options).then(success, error);
    }
    else {
        e.fetch().then(success, error);
    }
}


/**
 * Other utilities.
 */

/**
 * Retrieve a new UUID.
 * @returns - a UUID string.
 */
function get_uuid() {
    return uuid.v4();
}

/**
 * Convert an IP to a numeric value.
 * @param dot - the ip value.
 * @returns {number}
 */
function dot2num(dot) {
    var d = dot.split('.');
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
}

/**
 * Convert a numeric value to a formatted IP address.
 * @param num - the numeric value.
 * @returns {number}
 */
function num2dot(num) {
    var d = num % 256;
    for (var i = 3; i > 0; i--) {
        num = Math.floor(num / 256);
        d = num % 256 + '.' + d;
    }
    return d;
}

/**
 * Combine to URL's ensure there are no extra slashes.
 * @param base_url - the base url.
 * @param relative_url - the relative url to append to it.
 * @returns {*} - the combined URL.
 */
function combine_urls(base_url, relative_url) {
    if (!_.endsWith(base_url, '/')) {
        if (_.startsWith(relative_url, '/')) {
            return base_url + relative_url;
        }
        else {
            return base_url + '/' + relative_url;
        }
    }
    else {
        if (_.startsWith(relative_url, '/')) {
            return base_url.substring(0, base_url.length - 1) + relative_url;
        }
        else {
            return base_url + relative_url;
        }
    }
}

exports.create = create;
exports.update = update;
exports.destroy = destroy;
exports.find = find;
exports.find_all = find_all;
exports.find_by_criteria = find_by_criteria;
exports.find_all_by_criteria = find_all_by_criteria;

exports.get_uuid = get_uuid;
exports.dot2num = dot2num;
exports.num2dot = num2dot;
exports.combine_urls = combine_urls;