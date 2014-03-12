define (require) ->

    Backbone = require 'backbone'

    ###
        Extend the Backbone collection class.
    ###
    class Collection extends Backbone.Collection