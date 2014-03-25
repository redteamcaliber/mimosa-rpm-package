define (require) ->

    Backbone = require 'backbone'
    Wreqr = require 'backbone.wreqr'

    # Return an event dispatcher singleton instance.
    return new Backbone.Wreqr.EventAggregator()