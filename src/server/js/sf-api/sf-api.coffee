async = require 'async'

# Setup underscore.
_ = require 'underscore'
_.str = require 'underscore.string'
_.mixin _.str.exports()

moment = require 'moment'
request = require 'm-request'
settings = require 'settings'
log = require 'winston'
api_utils = require 'api-utils'
xml = require 'xml2js'


uac_api = require 'uac-api'

redis = require("redis")
redisClient = redis.createClient()
props = require('pathval')


#
# Retrieve the list of MCIRT services.
# @param attributes - sso attributes.
# @param callback - function(err, services)
#
get_services = (attributes, callback) ->
    url = get_sf_url('services')
    request.json_get url, {}, attributes, (err, response, body) ->
        callback(err, body)

get_clusters = (attributes, callback) ->
    url = get_sf_url('clusters');
    request.json_get url, {}, attributes, (err, response, body) ->
        callback(err, body)

#
# Retrieve the services, clients, and clusters lists in parallel.
# @param attributes - the sso attributes.
# @param callback - function(err, results).
#
get_services_clients_clusters = (attributes, callback) ->
    async.parallel(
        [
            (callback) ->
                get_services(attributes, callback)
            ,
            (callback) ->
                get_clusters(attributes, callback)
        ],
        (err, results) ->
            if err
                callback(err);
            else
                services = results[0]
                clusters = results[1]
                client_map = {}
                for cluster in clusters
                    if not (cluster.client_uuid in client_map)
                        client_map[cluster.client_uuid] =
                            client_uuid: cluster.client_uuid
                            client_name: cluster.client_name
                            client_alias: cluster.client_alias
                callback null, {
                    services: services,
                    clients: _.values(client_map),
                    clusters: clusters
                }
    )

#
# Retrieve the list of tag names.
# @param attributes - sso attributes.
# @param callback - function(err, tagnames)
#
get_tags = (attributes, callback) ->
    url = get_sf_url('tags')
    request.json_get url, {}, attributes, (err, response, body) ->
        callback(err, body)

#
# Retrieve the list of tag values that can be seached on.
# callback - function(err, tags)
#
get_searchable_tags = (attributes, callback) ->
    url = get_sf_url('tags')
    request.json_get url, {}, attributes, (err, response, body) ->
        results = []
        body.forEach (tag) ->
            if tag.name != 'notreviewed'
                results.push(tag)
        callback(err, results)

get_ioc_summary = (params, attributes, callback) ->
    url = get_sf_url('ioc-summary')
    request.json_get url, params, attributes, (err, response, body) ->
        callback(err, body)

#
# Retrieve the IOC summaries in the FE alerting format.
#
get_ioc_summary_v2 = (params, attributes, callback) ->
    request.json_get get_sf_url('/v2/ioc-summary'), params, attributes, (err, response, body) ->
        callback err, body

#
# Retrieve hits based on the params.
# @param params
# @param attributes
# @param callback
#
get_hits = (params, attributes, callback) ->
    url = get_sf_url('hits')
    request.json_get url, params, attributes, (err, response, body) ->
        if err
            callback(err)
        else
            # If there are results and the user has chosen to view hits by tagname.  Merge in Seasick hostname data.
            if body.results && body.results.length > 0 && params.tagname
                # Get the list of hashes for the hits.
                hash_list = []
                body.results.forEach (row) ->
                    hash_list.push(row.am_cert_hash)

                get_hosts_by_hash_list hash_list, attributes, (err, hosts) ->
                    if err
                        # Error, unable to obtain the related host data from seasick.  Return the results anyway
                        # indicating that there was an error.
                        log.error('Unable to retrieve hosts from seasick - ' + err)
                        body.results.forEach (row) ->
                            row.hostname = '[Error]'
                    else
                        # Add the host to each of the hits.
                        host_map = {}
                        hosts.forEach (host) ->
                            host_map[host.hash] = host

                        body.results.forEach (row) ->
                            row.hostname = if row.am_cert_hash of host_map then host_map[row.am_cert_hash].hostname else ''

                    # Return the merged results.
                    callback(null, body)
            else
                callback(null, body)

#
# Find all suppressions.  This call does NOT page results and returns all suppressions.
# @param attributes - sso attributes.
# @param callback - function(err, suppressions)
#
get_suppressions = (attributes, callback) ->
    url = get_sf_url('suppressions')
    request.json_get url, {limit: 0}, attributes, (err, response, body) ->
        callback(err, body)

#
# Retrieve a suppression by id.
# @param suppression_id - the suppression id.
# @param attributes - sso attributes.
# @param callback - function(err, suppression).
#
get_suppression = (suppression_id, attributes, callback) ->
    url = get_sf_url('suppressions')
    request.json_get url, {suppression_id: suppression_id}, attributes, (err, response, body) ->
        if  err
            callback err
        else
            if not body or body.length == 0
                # The suppression was not found.
                callback(null, null)
            else if body.length == 1
                callback(null, body[0])
            else
                console.dir(body)
                callback('Unable to process get_suppression response: ' + body)

get_rowitem_content = (rowitem_uuid, attributes, callback) ->
    url = get_sf_url(_.sprintf('hits/%s/content', rowitem_uuid))
    request.json_get url, {}, attributes, (err, response, body) ->
        if err
            if response and response.statusCode == 404
                callback(null, null)
            else
                callback(err)
        else
            toJSON body.content, (err, json) ->
                if err
                    callback(err)
                else
                    body.content = json
                    callback(null, body)

toJSON = (xml_content, callback) ->
    options = {
        normalizeTags: true,
        trim: true,
        explicitArray: false
    }
    xml.parseString xml_content, options, (err, json) ->
        if err
            callback(err)
        else
            callback(null, json)

#
# Retrieve the tag summary counts for a host.
# @param am_cert_hash - the host to match.
# @param attributes - the original request.
# @param callback - function(err, response, body).
#
get_tag_summary_by_hash = (am_cert_hash, attributes, callback) ->
    url = get_sf_url 'tag-summary?am_cert_hash=' + am_cert_hash
    request.json_get url, {}, attributes, (err, response, body) ->
        callback(err, body)

#
# Retrieve the list of tasks for a user.
# @param attributes - sso attributes.
# @param callback - function(err, body)
#
get_tasks = (attributes, callback) ->
    url = get_sf_url('tasks')
    request.json_get url, {}, attributes, (err, response, body) ->
        callback(err, body)

#
# Post a tag to a row.
# @param rowitem_uuid - the row.
# @param attributes - sso attributes.
# @param tagname - the tag.
# @param callback - function(err, body)
#
post_tag = (rowitem_uuid, attributes, tagname, callback) ->
    body = {
        tagname: tagname
    }
    url = get_sf_url(_.sprintf('hits/%s/settag', rowitem_uuid))
    request.json_post url, body, attributes, (err, response, body) ->
        callback(err, body)

#
# Post a comment to a row.
# @param rowitem_uuid - the row.
# @param comment - the body containing the comment.
# @param attributes - sso attributes.
# @param callback - function(err, body)
#
post_comment = (rowitem_uuid, comment, attributes, callback) ->
    body = {
        comment: comment,
        token: 'NA',
        type: 'default'
    }
    url = get_sf_url(_.sprintf('hits/%s/addcomment', rowitem_uuid))
    request.json_post url, body, attributes, (err, response, body) ->
        callback(err, body)

#
# Process the hosts adding counts and host metadata to each item.
# @param hosts - the list of hosts.
# @param attributes - sso attributes.
# @param callback - function(err, hosts)
#
process_hosts = (hosts, attributes, callback) ->
    async.each(
        hosts,
        (host, callback) ->
            get_tag_summary_by_hash host.hash, attributes, (err, counts) ->
                if err
                    callback(err)
                else
                    host.counts = counts
                    callback()
        ,
        (err) ->
            # Return the processed hosts.
            if err
                callback(err)
            else
                add_host_metadata(hosts)
                callback(null, hosts)
    )

#
# Add additional metadata for display to each of the hosts.
#
add_host_metadata = (hosts) ->
    last_2_hours = moment().subtract('hours', 2)
    last_24_hours = moment().subtract('hours', 24)
    last_48_hours = moment().subtract('hours', 48)

    hosts.forEach (host) ->
        if host.time_logged
            # Add the time metadata.
            time_logged = moment(host.time_logged, 'YYYY-MM-DDTHH:mm:ss Z')

            log.debug('time_logged: ' + time_logged.format('YYYY-MM-DD HH:mm:ss'))
            log.debug('last 2 hours: ' + last_2_hours.format('YYYY-MM-DD HH:mm:ss'))
            log.debug('within 2 hours: ' + time_logged.isAfter(last_2_hours))

            host.time_formatted = time_logged.format('YYYY-MM-DD HH:mm:ss')
            if  time_logged.isAfter(last_2_hours) || time_logged.isSame(last_2_hours)
                host.time_caption = 'Within 2 Hours'
                host.time_label = 'success'
            else if time_logged.isAfter(last_24_hours) || time_logged.isSame(last_24_hours)
                host.time_caption = 'Within 24 Hours'
                host.time_label = 'info'
            else if time_logged.isAfter(last_48_hours) || time_logged.isSame(last_48_hours)
                host.time_caption = 'Within 48 Hours'
                host.time_label = 'warning'
            else
                host.time_caption = 'More Than 48 Hours'
                host.time_label = 'danger'
        else
            # Unable to render time metadata.
            host.time_formatted = 'NA'
            host.time_caption = 'NA'

#
# Retrieve the host data by am_cert_hash.  The response will contain the related IOC summary counts.
# @param hash - the am_cert_hash criteria.
# @param attributes - sso attributes.
# @param callback - function(err, host)
#
get_full_host_by_hash = (hash, attributes, callback) ->
    async.waterfall(
        [
            (callback) ->
                # Retrieve the host.
                get_host_by_hash(hash, attributes, callback)
            ,
            (host, callback) ->
                # Mix in the ioc summary counts.
                if host then process_hosts([host], attributes, callback) else callback(null, [])
        ],
        (err, hosts) ->
            if err
                callback(err)
            else
                callback(null, hosts[0])
    )

#
# Retrieve the matching hosts for the list of ip's and mix in the related tag counts for each host.
# @param ips
# @param attributes
# @param callback
#
get_full_hosts_by_ip = (ips, attributes, callback) ->
    async.waterfall(
        [
            (callback) ->
                # Retrieve the hosts by ip address.
                get_hosts_by_ip(ips, attributes, callback)
            ,
            (hosts, callback) ->
                process_hosts(hosts, attributes, callback)
        ],
        (err, hosts) ->
            callback(err, hosts)
    )

#
# Retrieve the matching hosts for the list of hostnames and mix in the related tag counts for each host.
# @param hostnames
# @param attributes
# @param callback
#
get_full_hosts_by_name = (hostnames, attributes, callback) ->
    async.waterfall(
        [
            (callback) ->
                get_hosts_by_name(hostnames, attributes, callback)
            ,
            (hosts) ->
                # For each of the hosts look up the tag counts and add metadata.
                process_hosts(hosts, attributes, callback)
        ],
        (err, hosts) ->
            callback(err, hosts)
    )

#
# Forward a GET request to the SF API.
# @param req - the original request.
# @param callback - function(err, response, body)
#
get_sf = (req, callback) ->
    url = get_sf_url(req.originalUrl.substring('/sf/api'.length, req.originalUrl.length))
    request.json_get(url, {}, req.attributes, callback)

#
# Forward a POST request to the SF API.
# @param req - the original request.
# @param callback - function(err, response, body)
#
post_sf = (req, callback) ->
    url = get_sf_url(req.originalUrl.substring('/sf/api'.length, req.originalUrl.length))
    request.json_post(url, req.body, req.attributes, callback)

#
# Forward a DELETE request to the SF API.
# @param req - the original request.
# @param callback - function(err, body)
#
delete_sf = (req, callback) ->
    url = get_sf_url(req.originalUrl.substring('/sf/api'.length, req.originalUrl.length))
    request.json_delete(url, req.attributes, callback)

#
# Seasick API's
#
#
# Retrieve information for one or more hosts based on  the am_cert_hash's in the list. Will use a redis cache
# to optimize retrieval time.
# @param hashList - the list of am_cert_hash criteria.
# @param attributes - sso attributes.
# @param callback - function(err, hosts)
#
get_hostinfo_by_hash_list = (hashList, attributes, callback) ->
  unless _.isArray hashList then hashList = [hashList]
  async.waterfall [
    (callback)->
      #retrieve any hashes that we've already cached
      redisClient.mget hashList, (err, cachedHashes)->
        #filter out the hashes that weren't found
        cachedHashes = _.filter cachedHashes, (hash)-> _.isString hash

        #convert the json values back into objects
        cachedHashes = _.map cachedHashes, (hash)-> JSON.parse(hash)

        #filter out hashes in the hashList that are in the cachedHashes
        uncachedHashes = _.filter hashList, (hash)-> _.isUndefined(_.findWhere(cachedHashes, {"hash":hash}))

        callback(null, cachedHashes, uncachedHashes)

    (cachedHashes, uncachedHashes, callback)->

      #retrieve the hashes that weren't cached
      if uncachedHashes.length > 0

        get_hosts_by_hash_list uncachedHashes, attributes, (err, objects) ->

          #prune the records to only contain the properties requested
          desiredProperties = settings.get(settings.REDIS_AMHASH_CACHED_PROPERTIES)
          recordTTL = settings.get(settings.REDIS_AMHASH_TIMEOUT_SECS)
          filteredRecords = pluckMany objects, desiredProperties

          #iterate over the filtered records and add them to redis
          _.each filteredRecords, (record)-> redisClient.setex record.hash, recordTTL, JSON.stringify(record)

          callback(null, filteredRecords.concat(cachedHashes))
      else
        callback(null, cachedHashes)
  ], (err, results)->
      callback null, JSON.stringify(results)

pluckMany = (list, propertyNames)->
  _.map list, (item)->
    obj = {}
    _.each propertyNames, (property)->
      props.set obj, property, props.get(item, property)
    return obj

#
# Retrieve the list of hosts for the am_cert_hash's in the list.  This call batches up the list of hashes and retrieves
# them from Seasick in a single call.  Note: This call does not merge in the tag counts or other values.
# @param hash_list - the list of am_cert_hash criteria.
# @param attributes - sso attributes.
# @param callback - function(err, hosts)
#
get_hosts_by_hash_list = (hash_list, attributes, callback) ->
    url = get_ss_url('api/v1/agent/set')

    form =
        hash: hash_list

    request.form_post url, form, attributes, (err, response, body) ->
        if err
            callback(err)
        else if body
            o = JSON.parse(body)
            callback(null, if o.objects then o.objects else [])
        else
            callback(null, [])

#
# Retrieve the host matching the hash value and mix in the related tag counts for each host.
# @param hash
# @param attributes
# @param callback
#
get_host_by_hash = (hash, attributes, callback) ->
    get_hosts_by_hash_list [hash], attributes, (err, objects) ->
        if err
            callback(err)
        else if objects.length <= 0
            # No values returned, return null.
            callback(null, null)
        else if objects.length == 1
            # OK, found the host.
            callback(null, objects[0])
        else  # (objects.length > 1)
            # Error, two many values returned.
            callback('More than one agent returned for hash: ' + hash)

#
# Retrieve hosts by host name.
# @param hostnames - a list of hostnames to search for.
# @param attributes - sso attributes.
# @param callback - function(err, hosts)
#
get_hosts_by_name = (hostnames, attributes, callback) ->
    host_params = hostnames.join(',')
    url = get_ss_url('api/v1/agent/?hostname__icontains=' + host_params)
    request.json_get url, {}, attributes, (err, response, body) ->
        if err
            callback(err)
        else
            callback(null, if body && body.objects then body.objects else [])

#
# Retrieve hosts by IP.
# @param ips - the list of ips to search for.
# @param attributes - sso attributes.
# @param callback - function(err, hosts)
#
get_hosts_by_ip = (ips, attributes, callback) ->
    converted_ips = []
    ips.forEach (ip)->
        try
            converted_ips.push(api_utils.dot2num(ip))
        catch e
            # Error
            log.error(e.stack)
            return callback('Unable to convert ip: ' + ip)
    ip_params = converted_ips.join(',')
    url = get_ss_url('api/v1/agent/?ip__in=' + ip_params)
    request.json_get url, {}, attributes, (err, response, body) ->
        if err
            callback(err)
        else
            callback(null, if body && body.objects then body.objects else [])

#
# Post an acquisition.
# @param params - the additional acquisitions parameters to send.
# @param attributes - sso attributes.
# @param callback - function(err, body)
#
post_acquisition = (params, attributes, callback) ->
    # Post the acquisition.
    url = get_ss_url(_.sprintf('clusters/%s/agents/%s/acquisitions/', params.cluster_uuid, params.am_cert_hash))

    request.form_post url, params, attributes, (err, response, json) ->
        if err
            # Error
            log.error(_.sprintf('Exception while submitting acquisition for cluster_uuid: %s and hash: %s', params.cluster_uuid, params.hash))
            log.error(err)
            callback(err)
        else
            body = JSON.parse(json)
            if not body.state
                # Error, state is invalid.
                callback('Invalid acquisition state - ' + body)
            else if body.state != 'created'
                # Error, acquisition not submitted.
                callback('Acquisition request state was not submitted: ' + json.state)
            else
                # Ok
                comment = _.sprintf('Acquisition (%s) FilePath: %s FileName: %s', body.uuid, params.file_path, params.file_name)

                async.series(
                    [
                        (callback) ->
                            # Post process the acquisition.
                            async.parallel(
                                [
                                    (callback) -> (
                                        # Post the users acquisition comment if it exists.
                                        if params.comment
                                            post_comment(params.rowitem_uuid, params.comment, attributes, callback)
                                        else
                                            callback()
                                    )
                                    (callback) -> (
                                        # Tag the row to investigating.
                                        post_tag(params.rowitem_uuid, attributes, 'investigating', callback)
                                    )
                                    (callback) -> (
                                        # Associate the acquisition with the identity.
                                        uac_api.create_identity_acquisition params.identity, body.uuid, attributes.user_uuid, attributes.uid, callback
                                    )
                                ],
                                (err) ->
                                    # Done.
                                    callback(err)
                            )
                    ],
                    (err) ->
                        if err
                            # Error.
                            log.error(_.sprintf('Exception while processing acquisition for cluster_uuid: %s and ' +
                                'hash: %s', params.cluster_uuid, params.hash))
                            log.error(err)
                            callback(err)
                        else
                            # OK.
                            log.info(_.sprintf('Successfully submitted acquisition request for cluster_uuid: %s and ' +
                                'hash: %s', params.cluster_uuid, params.hash))
                            callback(null, body)
                )

#
# Add the link field to an acquisition instance.
# @param acquisition - the acquisition.
#
add_acquisition_link = (acquisition) ->
    if acquisition && acquisition.acquired_file
        acquisition.link = get_ss_url(acquisition.acquired_file)


#Retrieve the list of tasks
get_task_result = (params, attributes, callback)->
  #TODO: use a real URL here!!!
  #url = get_ss_url('api/v1/acquisition/')
  console.lot
  url = "https://proc1.htap.us1.devnet.mcirt.mandiant.com/api/v1/task_result/"
#  if not params or !params.order_by
#    params.order_by = '-create_datetime'
  request.json_get url, params, attributes, (err, response, body) ->
    if err
      # Error
      callback(err)
    else
      # Fill in a link value for each acquisition.
#      body.objects.forEach(add_acquisition_link)
      console.log "in callback!"
      callback(null, body)

#
# Retrieve the list of acquisitions by a comma separated list of clusters.
# @param params - todo:
# @param attributes - sso attributes.
# @param callback - function(err, acquisitions)
#
get_acquisitions = (params, attributes, callback) ->
    url = get_ss_url('api/v1/acquisition/')
    if not params or !params.order_by
        params.order_by = '-create_datetime'
    request.json_get url, params, attributes, (err, response, body) ->
        if err
            # Error
            callback(err)
        else
            # Fill in a link value for each acquisition.
            body.objects.forEach(add_acquisition_link)

            callback(null, body)

#
# Retrieve acquisition details.
# @param acquisition_uuid - the acquisition id.
# @param attributes - the sso attributes.
# @param callback - function(err, acquisition)
#
get_acquisition = (acquisition_uuid, attributes, callback) ->
    url = get_ss_url(_.sprintf('api/v1/acquisition/%s/', acquisition_uuid))
    request.json_get url, {}, attributes, (err, response, body) ->
        if err
            callback(err)
        else
            add_acquisition_link(body)
            callback(null, body)

#
# Retrieve a list of acquisitions by id.
# @param ids - a list of acquisition ids.
# @param attributes - sso attributes.
# @param callback - function(err, acquisitions).
#
get_acquisitions_by_id = (ids, attributes, callback) ->
    if ids && ids.length > 0
        id_params = ids.join(',')
        url = get_ss_url(_.sprintf('api/v1/acquisition/?uuid__in=%s', id_params))
        request.json_get url, {}, attributes, (err, response, body) ->
            if err
                # Error.
                callback(err)
            else
                if (body.objects)
                    body.objects.forEach(add_acquisition_link)
                    callback(null, body.objects)
                else
                    callback(null, [])
    else
        # Nothing to process.
        callback(null, [])

#
# Retrieve a list of acquisitions by identity.
# @param identity - the identity.
# @param attributes - sso attributes.
# @param callback - function(err, acquisitions)
#
get_acqusitions_by_identity = (identity, attributes, callback) ->
    async.waterfall(
        [
            (callback) ->
                # Retrieve the list of acquisitions for the identity.
                uac_api.get_identity_acquisitions_by_identity(identity, callback)
            ,
            (identity_acquisitions, callback) ->
                # Look up and return the related acquisitions.
                acquisition_uuids = _.pluck(identity_acquisitions, 'acquisition_uuid')
                get_acquisitions_by_id(acquisition_uuids, attributes, callback)
        ],
            (err, acquisitions) ->
                if err
                    # Error
                    callback(err)
                else
                    # Add the acquisition link content.
                    acquisitions.forEach(add_acquisition_link)
                    callback(null, acquisitions)
    )


#
# Retrieve the audit related to an acquisition.
# @param acquisition_id - the acquisition id.
# @param attributes - request attributes.
# @param callback - function(err, audit).  Returns null if no audit was found.
#
get_acquisition_audit = (acquisition_id, attributes, callback) ->
    url = get_ss_url(_.sprintf('api/v1/acquisition/%s/fileitem/', acquisition_id))
    request.json_get url, {}, attributes, (err, response, body) ->
        if  response.statusCode == 404
            callback(null, null)
        else
            callback(err, body)


#
# Exports
#
exports.get_sf = get_sf
exports.post_sf = post_sf
exports.delete_sf = delete_sf
exports.get_services = get_services
exports.get_clusters = get_clusters
exports.get_services_clients_clusters = get_services_clients_clusters

# Tags.
exports.get_tags = get_tags
exports.get_searchable_tags = get_searchable_tags
exports.post_tag = post_tag

# IOC Summary.
exports.get_ioc_summary = get_ioc_summary
exports.get_ioc_summary_v2 = get_ioc_summary_v2

# Hits.
exports.get_hits = get_hits
exports.get_rowitem_content = get_rowitem_content
exports.get_tag_summary_by_hash = get_tag_summary_by_hash
exports.post_comment = post_comment

# Tasks.
exports.get_tasks = get_tasks

# Suppressions.
exports.get_suppression = get_suppression
exports.get_suppressions = get_suppressions

# Seasick.
exports.get_full_hosts_by_ip = get_full_hosts_by_ip
exports.get_full_hosts_by_name = get_full_hosts_by_name
exports.get_hostinfo_by_hash_list = get_hostinfo_by_hash_list
exports.get_hosts_by_hash_list = get_hosts_by_hash_list
exports.get_host_by_hash = get_host_by_hash
exports.get_hosts_by_name = get_hosts_by_name
exports.get_hosts_by_ip = get_hosts_by_ip
exports.get_full_host_by_hash = get_full_host_by_hash
exports.get_task_result = get_task_result
exports.post_acquisition = post_acquisition
exports.get_acquisitions = get_acquisitions
exports.get_acquisition = get_acquisition
exports.get_acquisitions_by_id = get_acquisitions_by_id
exports.get_acqusitions_by_identity = get_acqusitions_by_identity
exports.get_acquisition_audit = get_acquisition_audit
exports.add_host_metadata = add_host_metadata

exports.toJSON = toJSON


#
# Utilities
#

get_sf_url = (relative_url) ->
    api_utils.combine_urls settings.get(settings.UAC_SF_API_URL), relative_url

get_ss_url = (relative_url) ->
    api_utils.combine_urls settings.get(settings.UAC_SS_API_URL), relative_url