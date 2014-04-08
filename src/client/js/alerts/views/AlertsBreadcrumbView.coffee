define (require) ->

    vent = require 'uac/common/vent'
    BreadcrumbView = require 'uac/views/BreadcrumbView'

    Events = require 'alerts/common/Events'

    ALERTS_FILTERS = 'alerts_filters'
    ALERTS_SELECTION = 'alerts_selection'
    ALERTS_DETAILS = 'alerts_details'

    #
    # View to display alerts breadcrumbs.  This view listens for global events and updates accordingly.
    #
    class AlertsBreadcrumbView extends BreadcrumbView
        initialize: ->
            super

            @render_alerts_filters()

            vent.on Events.ALERTS_SEARCH, @render_alerts_selection
            vent.on Events.ALERTS_ALERT_SELECTED, @render_alerts_details
            vent.on "breadcrumb:#{ALERTS_FILTERS}", @render_alerts_filters
            vent.on "breadcrumb:#{ALERTS_SELECTION}", @render_alerts_selection
            vent.on "breadcrumb:#{ALERTS_DETAILS}", @render_alerts_details
            return

        push_alerts: ->
            @push '<i class="fa fa-exclamation-circle"></i> Alerts'
            return @

        push_alerts_filters: ->
            @push '<i class="fa fa-filter"></i> Alert Filters', ALERTS_FILTERS
            return @

        push_alerts_selection: ->
            @push '<i class="fa fa-list"></i> Alert Selection', ALERTS_SELECTION
            return @

        push_alerts_details: ->
            @push '<i class="fa fa-edit"></i> Alert Details', ALERTS_DETAILS
            return

        render_alerts_filters: =>
            if @collection.length > 0
                @collection.reset()
            @push_alerts()
            @push_alerts_filters()
            return @render()

        render_alerts_selection: =>
            if @collection.length > 0
                @collection.reset()
            @push_alerts()
            @push_alerts_filters()
            @push_alerts_selection()
            return @render()

        render_alerts_details: =>
            if @collection.length > 0
                @collection.reset()
            @push_alerts()
            @push_alerts_filters()
            @push_alerts_selection()
            @push_alerts_details()
            return @render()

    return AlertsBreadcrumbView
