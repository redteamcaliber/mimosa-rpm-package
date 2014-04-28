define (require) ->

    Backbone = require 'backbone'
    Marionette = require 'marionette'


    # Return an event dispatcher singleton instance.
    return new Backbone.Wreqr.EventAggregator()