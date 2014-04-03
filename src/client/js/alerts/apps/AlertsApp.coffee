define (require) ->

    Backbone = require 'backbone'
    Marionette = require 'marionette'
    vent = require 'uac/common/vent'

    templates = require 'alerts/ejs/templates'

    # Debug
    vent.on 'all', (event_name) ->
        console.debug "Event: #{event_name}"


    AlertsBreadcrumbView = require 'alerts/views/AlertsBreadcrumbView'
    AlertsSearchView = require 'alerts/views/AlertsSearchView'

    AlertSummaryCollection = require 'alerts/models/AlertSummaryCollection'
    AlertsSummaryTableView = require 'alerts/views/AlertsSummaryTableView'

    AlertCollection = require 'alerts/models/AlertCollection'
    AlertsTableView = require 'alerts/views/AlertsTableView'


    #
    # Layout for displaying the main alert template.
    #
    class AlertsLayout extends Backbone.Marionette.Layout
        template: templates['alerts-layout.ejs'],
        regions:
            breadcrumbs_region: '#alerts-breadcrumbs'
            filters_region: '#alerts-filters'
            filters_content_region: '#alerts-filters-content'
            list_region: '#alerts-lists'
            summary_list_region: '#alerts-summary-list'
            details_list_region: '#alerts-details-list'
            details_region: '#alert-details'
            details_content_region: '#alert-details-content'

        #
        # Listen to global events and show and hide regions accordingly.
        #
        initialize: ->
            vent.on 'alerts:search', =>
                @show_alerts_summary_list()

            vent.on 'alerts:summary_selected', =>
                @show_alerts_details_list()

            vent.on 'breadcrumb:alerts_filters', =>
                @show_alerts_filters()

            vent.on 'breadcrumb:alerts_selection', =>
                @show_alerts_selection()

            vent.on 'breadcrumb:alerts_details', =>
                @show_alerts_details()

        #
        # Bring the alerts filters to focus.
        #
        show_alerts_filters: ->
            $(@list_region.el).fadeOut(0).hide()
            $(@details_region.el).fadeOut(0).hide()
            $(@filters_region.el).fadeIn('slow').show()

        #
        # Bring the alerts selection view into focus with the alerts details list hidden.
        #
        show_alerts_summary_list: ->
            $(@filters_region.el).fadeOut(0).hide()
            $(@details_region.el).fadeOut(0).hide()
            $(@details_list_region.el).fadeOut(0).hide()
            $(@list_region.el).fadeIn('slow').show()

        show_alerts_details_list: ->
            $(@details_list_region.el).fadeIn('slow').show()
            $('html,body').animate
                scrollTop: $(@details_list_region.el).offset().top

        #
        # Bring the alerts details into focus.
        #
        show_alerts_details: ->
            $(@filters_region.el).fadeOut(0).hide()
            $(@list_region.el).fadeOut(0).hide()
            $(@details_region.el).fadeIn('slow').show()


    #
    # Alerts application instance.
    #
    AlertsApp = new Backbone.Marionette.Application()

    #
    # The main region.
    #
    AlertsApp.addRegions
        content_region: '#content'

    #
    # Initialize the alerts application.
    #
    AlertsApp.addInitializer ->
        # Create and display the main page layout.
        @layout = new AlertsLayout()
        @content_region.show @layout

        # Show/hide the default regions.
        @layout.show_alerts_filters()

        # Create the breadcrumbs view.
        @breadcrumbs_view = new AlertsBreadcrumbView()
        @layout.breadcrumbs_region.show @breadcrumbs_view

        # Create the filters view.
        @filters_view = new AlertsSearchView()
        @layout.filters_content_region.show @filters_view

        # Handle searching for alerts summaries.
        vent.on 'alerts:search', (params) =>
            unless @summary_list_view
                # Create the summary list table.
                @summaries = new AlertSummaryCollection()
                @summary_list_view = new AlertsSummaryTableView
                    id: 'alerts-summary-table'
                    collection: @summaries
                @layout.summary_list_region.show @summary_list_view

            # Fetch the summary list data.
            @data = {}
            @data.tag = params.tags if params.tags
            @data.client_uuid = params.clients if params.clients and params.clients.length > 0
            @data.alert_type = params.types if params.types and params.types.length > 0
            @data.is_endpoint_match = params.is_endpoint_match is true
            @data.begin = moment(params.from).unix() if params.from
            @data.end = moment(params.to).unix() if params.to

            @summary_list_view.fetch
                data: @data

        vent.on 'alerts:summary_selected', (row_data) =>
            unless @details_list_view
                # Create the details list view.
                @alerts = new AlertCollection()
                @details_list_view = new AlertsTableView
                    id: 'alerts-details-table'
                    collection: @alerts
                @layout.details_list_region.show @details_list_view

            if 'endpoint-match' in row_data.alert_types
                data = _.clone @data
                data.iocnamehash = row_data.namehash
            else
                data = _.clone @data
                data.signature_uuid = row_data.uuid

            @details_list_view.fetch {
                data: data
            }


    # Export the alerts application.
    AlertsApp