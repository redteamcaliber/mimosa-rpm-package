define (require) ->

    Backbone = require 'backbone'

    #
    # Alert summary model.
    #
    class AlertSummaryModel extends Backbone.Model
        idAttribute: 'uuid'

    AlertSummaryModel