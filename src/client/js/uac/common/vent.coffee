define (require) ->

    Backbone = require 'backbone'
    Backbone.Wreqr = require 'backbone.wreqr'

    # Return an event dispatcher singleton instance.
    return new Backbone.Wreqr.EventAggregator()