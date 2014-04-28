define (require) ->

    TimelineModel = require 'alerts/models/TimelineModel'

    class TimelineCollection extends Backbone.Collection
        model: TimelineModel

    TimelineCollection