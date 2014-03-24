define (require) ->

    BreadcrumbView = require 'uac/views/BreadcrumbView'

    class AlertsBreadcrumbView extends BreadcrumbView
        initialize: ->
            super

            # Add a default item to the root.
            @push_alerts()
            @push_filters()
            return

        push_alerts: ->
            @push '<i class="fa fa-exclamation-circle"></i> Alerts'
            return @

        push_filters: ->
            @push '<i class="fa fa-filter"></i> Alert Filters', 'alerts_filters'
            return @

        push_alert_selection: ->
            @push '<i class="fa fa-list"></i> Alert Selection', 'alerts_selection'
            return @

        push_alert_details: ->
            @push '<i class="fa fa-list"></i> Alert Details', 'alerts_details'
            return @

    return AlertsBreadcrumbView