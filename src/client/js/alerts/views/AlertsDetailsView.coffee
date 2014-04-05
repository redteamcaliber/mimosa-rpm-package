define (require) ->

    Marionette = require 'marionette'
    ChildViewContainer = require 'backbone.babysitter'

    vent = require 'uac/common/vent'

    templates = require 'alerts/ejs/templates'

    class AlertsDetailsView extends Marionette.ItemView
        template: templates['details-layout.ejs']
        templateHelpers:
            raw_alert: =>
                console.dir @model
                return ''

        regions:
            table_controls_region: '#table-controls'

        initialize: (options) ->
            super options

            @container = new ChildViewContainer()

            return @

        serializeData: ->
            data = super()
            console.dir data
            data

        close: ->
            @container.forEach (child) ->
                child.close()
            super
            return @

    return AlertsDetailsView