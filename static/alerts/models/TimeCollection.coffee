define (require) ->
    TimeModel = require 'alerts/models/TimeModel'

    class TimeCollection extends Backbone.Collection
        model: TimeModel
        url: '/alerts/api/times'

    return TimeCollection