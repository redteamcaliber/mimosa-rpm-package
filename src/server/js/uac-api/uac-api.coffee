async = require 'async'
pg = require 'pg'
log = require 'winston'

# Setup underscore.
_ = require 'underscore'

settings = require 'settings'
api_utils = require 'api-utils'
request = require 'm-request'

# The bookshelf library instance.
bookshelf_lib = require 'bookshelf'


# Initialize the bookshelf instance.
Bookshelf = bookshelf_lib.initialize
    debug: true
    client: 'postgres'
    connection:
        host: settings.get('uac:db_host')
        user: settings.get('uac:db_user')
        password: settings.get('uac:db_pass')
        database: settings.get('uac:db_name')
        charset: 'utf8'
    ,
    pool:
        #destroy  : function(client) { client.end(); }
        max: 10
        # optional. if you set this, make sure to drain() (see step 3)
        min: 2
        # specifies how long a resource can stay idle in pool before being removed
        idleTimeoutMillis: 30000
        # if true, logs via console.log - can also be a function
        log: false

# A local knex query builder reference.
knex = Bookshelf.knex



# Model class for an IOC term.
#
class IOCTermModel extends Bookshelf.Model
    tableName: 'iocterms'
    idAttribute: 'uuid'

#
# Model class for a collection of IOC terms.
#
class IOCTermCollection extends Bookshelf.Collection
    model: IOCTermModel

#
# Model class for a identity acquisition relationship.
#
class IdentityAcquisitionModel extends Bookshelf.Model
    tableName: 'identity_acquisitions'
    idAttribute: 'uuid'

class IdentityAcquisitionCollection extends Bookshelf.Collection
    model: IdentityAcquisitionModel

#
# Model class for UAC activity data.
#
class ActivityModel extends Bookshelf.Model
    tableName: 'activity'
    idAttribute: 'uuid'
    defaults:
        created: new Date()

#
# Collection class for ActivityModel data.
#
class ActivityCollection extends Bookshelf.Collection
    model: ActivityModel

#
# Model class for UAC alert activity.
#
class AlertActivityModel extends Bookshelf.Model
    tableName: 'alert_activity'
    idAttribute: 'uuid'

#
# Collection for AlertActivity data.
#
class AlertActivityCollection extends Bookshelf.Collection
    model: AlertActivityModel


#
# Retrieve the IOC terms related to type.
#
get_ioc_terms = (type, callback) ->
    api_utils.find_all_by_criteria IOCTermCollection, {text_prefix: type}, {}, callback
    return

#
# Create a new activity record.
#
create_activity = (activity_type, data, callback) ->
    api_utils.create ActivityModel,
        activity_type: activity_type
        data: if data then JSON.stringify(data) else undefined
    , callback
    return

#
# Delete an an activity record.
#
delete_activity = (uuid, callback) ->
    api_utils.destroy(ActivityModel, uuid, callback)
    return

#
# Create a new alert activity record.
#
create_alert_activity_fk = (alert_uuid, activity_uuid, callback) ->
    api_utils.create AlertActivityModel,
        alert_uuid: alert_uuid
        activity_uuid: activity_uuid
    , callback
    return

#
# Create an alert activity record.
#
create_alert_activity = (alert_uuid, type, data, callback) ->
    async.waterfall(
        [
            (callback) ->
                # Wrap with a transaction.
                Bookshelf.transaction (t) ->
                    callback null, t
            (t, callback) ->
                # Create an activity.
                create_activity type, data, (err, activity) ->
                    callback err, t, activity
            (t, activity, callback) ->
                # Create an alert activity.
                create_alert_activity_fk alert_uuid, activity.get('uuid'), (err, alert_activity) ->
                    callback err, t, activity, alert_activity
        ],
    (err, t, activity, alert_activity) ->
        if err
            # Roll the transaction back.
            t.rollback()
            callback(err)
        else
            # Commit the transaction.
            t.commit()
            # Ok.
            callback null, activity, alert_activity
    )
    return

#
# Create an alert comment activity.
#
create_alert_comment_activity = (alert_uuid, comment, callback) ->
    create_alert_activity alert_uuid, 'comment', {comment: comment}, callback

#
# Create an alert tag activity.
#
create_alert_tag_activity = (alert_uuid, tag, callback) ->
    create_alert_activity(alert_uuid, 'tag', {tag: tag}, callback)

#
# Retrieve the activity for an alert.
#
get_alert_activity = (alert_uuid, callback) ->
    try
        activities = ActivityCollection.forge()
        activities.query (qb) ->
            qb.join 'alert_activity', 'alert_activity.activity_uuid', '=', 'activity.uuid'
            qb.where 'alert_activity.alert_uuid', '=', alert_uuid
            qb.orderBy 'activity.created', 'desc'
        activities.fetch().then(
            (collection) ->
                callback null, collection
            ,
            (err) ->
                # Error
                message = "Exception while retrieving alert activity for uuid: #{alert_uuid} - #{err}"
                log.error message
                log.error err.stack
                callback message
        )
        return
    catch e
        callback e
        return

#
# Create a relationship between an identity and an acquisition.
#
create_identity_acquisition = (identity, acquisition_uuid, user_uuid, uid, callback) ->
    api_utils.create(IdentityAcquisitionModel, {
        identity: identity,
        acquisition_uuid: acquisition_uuid,
        user_uuid: user_uuid,
        uid: uid
    }, callback)

#
# Delete an identity acquisition relationship by id.
#
delete_identity_acquisition = (uuid, callback) ->
    api_utils.destroy(IdentityAcquisitionModel, uuid, callback)

#
# Retrieve all acquisitions for an identity.
#
get_identity_acquisitions_by_identity = (identity, callback) ->
    if identity
        api_utils.find_all_by_criteria(IdentityAcquisitionCollection, {
            identity: identity
        }, {}, callback)
    else
        callback(null, new Bookshelf.Collection([]))

#
# Retrieve all acquisitions for a user.
#
get_identity_acquisitions_by_user_uuid = (user_uuid, callback) ->
    api_utils.find_all_by_criteria(IdentityAcquisitionCollection, {
        user_uuid: user_uuid
    }, {}, callback)

#
# Retrieve the virus total details for the MD5.
get_vt_details = (md5, callback) ->
    url_base = settings.get('uac:mcube_api_url')
    auth_key = settings.get('uac:mcube_api_key')
    timeout  = settings.get('uac:mcube_api_timeout')

    url = api_utils.combine_urls(url_base, "/vtapi/v2/file/report?hashes=#{md5}")
    # Request settings.
    options = {
        url: url,
        json: true,
        headers: {
            'X-Authentication': auth_key
        },
        timeout: timeout ? timeout : 1000
    }

    # Make the call.
    request.get options, {}, (err, response, body) ->
        if err
            # Error.
            callback(err)
        else if  body and body.results and Array.isArray(body.results) and body.results.length == 1
            # There is a result from the API.
            #console.log(JSON.stringify(body, null, 4));

            # Parse the result.
            detected_count = 0
            first_element = body.results[0]
            if  first_element.vt
                keys = _.keys(first_element.vt)

                keys.forEach (key) ->
                    value = first_element.vt[key]
                    value.antivirus = key
                    if  value.detected
                        detected_count++

                # Debug
                log.debug('MD5: %s was detected %s out of %s', md5, detected_count, keys.length)

                callback null,
                    md5: first_element.md5
                    sha1: first_element.sha1
                    found: true
                    is_detected: detected_count > 0
                    detected_count: detected_count
                    count: keys.length
                    detected: _.values(first_element.vt)
                    updated: first_element.vt_updated
            else
                # Result not found.
                callback null,
                    md5: md5
                    found: false
                    is_detected: false
        else
            callback()

#
# Retrieve the details related to MD5.
get_md5_details = (md5, callback) ->
    # m-cube is configured.
    get_vt_details md5, (err, vt_result) ->
        callback null, {
            vt_err: err,
            vt: vt_result
        }


exports.get_ioc_terms = get_ioc_terms

exports.get_alert_activity = get_alert_activity
exports.create_activity = create_activity
exports.delete_activity = delete_activity
exports.create_alert_activity_fk = create_alert_activity_fk
exports.create_alert_activity = create_alert_activity
exports.create_alert_tag_activity = create_alert_tag_activity

exports.create_identity_acquisition = create_identity_acquisition
exports.delete_identity_acquisition = delete_identity_acquisition
exports.get_identity_acquisitions_by_identity = get_identity_acquisitions_by_identity
exports.get_identity_acquisitions_by_user_uuid = get_identity_acquisitions_by_user_uuid
exports.get_vt_details = get_vt_details
exports.get_md5_details = get_md5_details