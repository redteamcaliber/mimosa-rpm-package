define (require) ->

    Backbone = require 'backbone'

    class ActivityModel extends Backbone.Model
        idAttribute: 'uuid'
        url: ->

            return "/alerts/api/alerts/#{@attributes.alert_uuid}/activity"

        validate: (attr) ->
            results = []

            if _.isEmpty attr.comment
                results.push '"Comment" is required.'
            if _.isEmpty attr.alert_uuid
                results.push '"alert_uuid" is required.'

            if  results.length > 0
                results
            else
                null