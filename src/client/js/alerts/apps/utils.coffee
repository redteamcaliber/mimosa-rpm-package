define (require) ->

    utils = require 'uac/common/utils'

    get_tags = ->
        tags = utils.session 'alerts:tags'
        if tags
            result = new TagCollection()
            result.reset tags
        else
            result = new TagCollection()
            result.fetch
                async: false
            utils.session 'alerts:tags', result.toJSON()
        return

    get_tags: get_tags