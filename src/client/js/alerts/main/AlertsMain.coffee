define (require) ->
    _ = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    AlertsView = require 'alerts/views/AlertsView'

    # Load the custom theme styles.
    require('uac/common/utils').get_styles()


    #
    # Alerts application instance.
    #
    AlertsApp = new Marionette.Application()

    #
    # The main region.
    #
    AlertsApp.addRegions
        content_region: '#content'

    #
    # Initialize the alerts application.
    #
    AlertsApp.addInitializer ->

        # Debug
        @.listenTo vent, 'all', (event_name) ->
            console.debug "Event: #{event_name}"

        # Display the alerts view.
        @content_region.show new AlertsView()

    AlertsApp.start()

    return