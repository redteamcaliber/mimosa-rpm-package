define (require) ->
    Timeframe = require 'alerts/models/Timeframe'

    class TimeframeCollection extends Backbone.Collection
        model: Timeframe
        url: '/alerts/api/timeframes'

    return TimeframeCollection