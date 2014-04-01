define (require) ->

    AlertSummaryModel = require 'alerts/models/AlertSummaryModel'

    #
    # Alert summary collection.
    #
    class AlertSummaryCollection extends Backbone.Collection
        model: AlertSummaryModel
        url: '/alerts/api/summary'

    AlertSummaryCollection