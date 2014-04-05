define (require) ->
    Backbone = require 'backbone'

    #
    # Alert model full class.
    #
    class AlertFullModel extends Backbone.Model
        url: ->
            "/alerts/api/alerts/#{@uuid}/full"

    AlertFullModel