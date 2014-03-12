define (require) ->

    Backbone = require 'backbone'

    ###
        Tag model class.
    ###
    class TagModel extends Backbone.Model

        ###
            Tag collection class.
        ###
    class TagCollection extends Backbone.Collection
        model: TagModel
        url: '/alerts/api/tags'

    {
        TagModel: TagModel
        TagCollection: TagCollection
    }