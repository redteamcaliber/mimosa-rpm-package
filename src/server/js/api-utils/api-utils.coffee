#
#  API Utilities.
#


# Setup underscore.
_ = require('underscore')
_.str = require('underscore.string')
_.mixin(_.str.exports())

uuid = require('node-uuid')


#
# Bookshelf ORM Utilities.
#

#
# Create an entity.
# @param Entity - the entity class.
# @param values - the values for the new entity.
# @param callback - function(err, model).
#
create = (Entity, values, callback) ->
    Entity.forge(values).save({uuid: get_uuid()}).then(
        (model) ->
            callback(null, model)
        ,
        (err) ->
            callback(err)
    )
    return

#
# Update an entity.
# @param Entity - the entity class.
# @param values - the values for the entity.
# @param callback - function(err, model).
#
update = (Entity, values, callback) ->
    Entity.forge(values).save({uuid: get_uuid()}).then(
        (model) ->
            callback(null, model)
        ,
        (err) ->
            callback(err)
        )
    return

#
# Destroy an entity.
# @param Entity - the entity class.
# @param uuid - the id of the model.
# @param callback - function(err, model).
#
destroy = (Entity, uuid, callback) ->
    Entity.forge({uuid: uuid}).destroy().then(
        ->
            callback(null)
        ,
        (err) ->
            callback(err)
        )
    return

#
# Retrieve all models for a collection.
# @param Collection - the collection class.
# @param options - options to supply to bookshelf (relationships, etc).
# @param callback - function(err, collection).
#
find_all = (Collection, options, callback) ->
    find_all_by_criteria(Collection, {}, options, callback)

#
#
# @param Collection
# @param criteria
# @param options
# @param callback
#
find_all_by_criteria = (Collection, criteria, options, callback) ->
    q = Collection.forge().query()
    select = undefined
    if options && _.keys(options).length > 0
        select = q.where(criteria).select(options)
    else
        select = q.where(criteria).select()
    select.then(
        (collection) ->
            callback(null, collection)
        ,
        (err) ->
            # Error.
            callback(err)
    )

#
# Find a single entity by id.  Returns null if the entity is not found.
# @param Entity - the entity class.
# @param uuid - the entity id.
# @param options - options passed to the ORM.
# @param callback - function(err, entity).
#
find = (Entity, uuid, options, callback) ->
    e = Entity.forge({uuid: uuid})
    success = (model) ->
        callback(null, model)
    error = (err) ->
        callback(err)
    if options
        e.fetch(options).then(success, error)
    else
        e.fetch().then(success, error)

#
# Find a single entity by the specified criteria.  Returns null if the entity is not found.
# @param Entity - the entity class.
# @param criteria - the query criteria.
# @param options - options passed to the ORM.
# @param callback - function(err, entity).
#
find_by_criteria = (Entity, criteria, options, callback) ->
    e = Entity.forge(criteria)
    success = (model) ->
        callback(null, model)
    error = (err) ->
        callback(err)
    if options
        e.fetch(options).then(success, error)
    else
        e.fetch().then(success, error)

#
# Other utilities.
#

#
# Retrieve a new UUID.
# @returns - a UUID string.
#
get_uuid = ->
    return uuid.v4()

#
# Convert an IP to a numeric value.
# @param dot - the ip value.
# @returns {number}
#
dot2num = (dot) ->
    d = dot.split('.')
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3])

#
# Convert a numeric value to a formatted IP address.
# @param num - the numeric value.
# @returns {number}
#
num2dot = (num) ->
    d = num % 256
    i = 3
    while i > 0
        num = Math.floor(num / 256)
        d = num % 256 + '.' + d
        i = i - 1
    return d

#
# Combine to URL's ensure there are no extra slashes.
# @param base_url - the base url.
# @param relative_url - the relative url to append to it.
# @returns {*} - the combined URL.
#
combine_urls = (base_url, relative_url) ->
    if not _.endsWith(base_url, '/')
        if _.startsWith(relative_url, '/')
            return base_url + relative_url
        else
            return base_url + '/' + relative_url
    else
        if _.startsWith(relative_url, '/')
            return base_url.substring(0, base_url.length - 1) + relative_url
        else
            return base_url + relative_url

exports.create = create
exports.update = update
exports.destroy = destroy
exports.find = find
exports.find_all = find_all
exports.find_by_criteria = find_by_criteria
exports.find_all_by_criteria = find_all_by_criteria

exports.get_uuid = get_uuid
exports.dot2num = dot2num
exports.num2dot = num2dot
exports.combine_urls = combine_urls