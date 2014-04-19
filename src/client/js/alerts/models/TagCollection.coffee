define (require) ->

    Backbone = require 'backbone'
    utils = require 'uac/common/utils'
    TagModel = require 'alerts/models/TagModel'


    #
    # Tag collection class.
    #
    class TagCollection extends Backbone.Collection
        model: TagModel
        url: '/alerts/api/tags'

    TagCollection