define (require) ->

    utils = require 'uac/common/utils'
    TagCollection = require 'alerts/models/TagCollection'

    #
    # Retrieve the alerts tags.
    #
    get_tags = ->
        tags = utils.session 'alerts:tags'
        if not tags
            tags_collection = new TagCollection()
            tags_collection.fetch
                async: false
            tags_collection.fetch()
            tags = tags_collection.toJSON()
            utils.session 'alerts:tags', tags
        tags

    #
    # Retrieve a map of tags by tag id.
    #
    get_tag_map = ->
        tags = get_tags()
        tag_map = {}
        tags.forEach (tag) ->
            tag_map[tag.id] = tag
        tag_map

    get_tags: get_tags
    get_tag_map: get_tag_map