define (require) ->

    AlertModel = require 'alerts/models/AlertModel'

    #
    # Alerts collection.
    #
    class AlertCollection extends Backbone.Collection
        model: AlertModel
        url: '/alerts/api/alerts'

    AlertCollection