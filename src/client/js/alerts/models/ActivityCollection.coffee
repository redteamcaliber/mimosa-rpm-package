define (require) ->

    ActivityModel = require 'alerts/models/ActivityModel'


    class ActivityCollection extends Backbone.Collection
        model: ActivityModel
        url: =>
            return "/alerts/api/alerts/#{@alert_uuid}/activity"
