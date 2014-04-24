define (require) ->

    Backbone = require 'backbone'
    TagModel = require 'uac/models/TagModel'

    class TagCollection extends Backbone.Collection
        model: TagModel