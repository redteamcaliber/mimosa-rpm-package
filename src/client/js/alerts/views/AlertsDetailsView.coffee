define (require) ->

    Marionette = require 'marionette'

    templates = require 'alerts/ejs/templates'


    class AlertsDetailsView extends Marionette.ItemView
        template: templates['details-layout.ejs']

        initialize: (options) ->
            return

    return AlertsDetailsView