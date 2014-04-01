define (require) ->

    Backbone = require 'backbone'
    TagModel = require 'alerts/models/TagModel'


    ###
        Tag collection class.
    ###
    class TagCollection extends Backbone.Collection
        model: TagModel
        url: '/alerts/api/tags'

    TagCollection