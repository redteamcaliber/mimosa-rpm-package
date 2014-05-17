define (require) ->

    Marionette = require 'marionette'
    vent = require 'uac/common/vent'
    utils = require 'uac/common/utils'
    FetchController = require 'uac/controllers/FetchController'

    templates = require 'alerts/ejs/templates'


    AlertsEvents = require 'alerts/common/AlertsEvents'
    AlertsBreadcrumbView = require 'alerts/views/AlertsBreadcrumbView'
    AlertsSearchView = require 'alerts/views/AlertsSearchView'

    AlertSummaryCollection = require 'alerts/models/AlertSummaryCollection'
    AlertsSummaryTableView = require 'alerts/views/AlertsSummaryTableView'

    AlertCollection = require 'alerts/models/AlertCollection'
    AlertsTableView = require 'alerts/views/AlertsTableView'

    AlertsDetailsView = require 'alerts/views/AlertsDetailsView'
    AlertFullModel = require 'alerts/models/AlertFullModel'

    HitsDetailsView = require 'sf/views/HitsDetailsView'


    class AlertsView extends Marionette.Layout
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
        # Initialize the alerts view.
        #
        initialize: ->
            @initialize_breadcrumb_listeners()

            @listenTo vent, AlertsEvents.ALERTS_SEARCH, @on_alerts_search
            @listenTo vent, AlertsEvents.ALERTS_SUMMARY_SELECTED, @on_alerts_summary_selected
            @listenTo vent, AlertsEvents.ALERTS_ALERT_SELECTED, @on_alerts_details_selected

        #
        # Render the views.
        #
        onShow: ->
            # Create the breadcrumbs view.
            @breadcrumbs_view = new AlertsBreadcrumbView()
            @breadcrumbs_region.show @breadcrumbs_view

            # Create the filters view.
            @filters_view = new AlertsSearchView()
            @filters_content_region.show @filters_view

            # Show/hide the default regions.
            @show_alerts_filters()

        #
        # Initialize the listeners for the breadcrumb portion of the view.
        #
        initialize_breadcrumb_listeners: ->
            # Listen to global events and show and hide regions accordingly.
            @.listenTo vent, AlertsEvents.ALERTS_SEARCH, =>
                @show_alerts_summary_list()

            @.listenTo vent, AlertsEvents.ALERTS_SUMMARY_SELECTED, =>
                @show_alerts_details_list()

            @.listenTo vent, AlertsEvents.ALERTS_ALERT_SELECTED, =>
                @show_alerts_details()

            @.listenTo vent, 'breadcrumb:alerts_filters', =>
                @show_alerts_filters()

            @.listenTo vent, 'breadcrumb:alerts_selection', =>
                # Reload the details list.
                #@on_alerts_summary_selected()

                @show_alerts_details_list()

            @.listenTo vent, 'breadcrumb:alerts_details', =>
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
            $(@filters_region.el).fadeOut(0).hide()
            $(@details_region.el).fadeOut(0).hide()
            $(@details_list_region.el).show()
            $(@list_region.el).fadeIn('slow').show()

            # Scroll to the top of the alerts details list.
            $('html,body').animate
                scrollTop: $(@details_list_region.el).offset().top

        #
        # Bring the alerts details into focus.
        #
        show_alerts_details: ->
            $(window.document.body).scrollTop(0)
            $(@filters_region.el).fadeOut(0).hide()
            $(@list_region.el).fadeOut(0).hide()
            $(@details_region.el).fadeIn('slow')

        #
        # Process the users search for alerts.
        #
        on_alerts_search: (params) =>
            # Create the summary list table.
            summaries = new AlertSummaryCollection()
            summary_list_view = new AlertsSummaryTableView
                id: 'alerts-summary-table'
                collection: summaries

            controller = new FetchController
                collection: summaries
                view: summary_list_view
                region: @summary_list_region
                loading: true

            # Fetch the summary list data.
            @alerts_search_params = {}
            @alerts_search_params.tag = params.tags if params.tags
            @alerts_search_params.client_uuid = params.clients if params.clients and params.clients.length > 0
            @alerts_search_params.alert_type = params.types if params.types and params.types.length > 0
            @alerts_search_params.begin = moment(params.from).unix() if params.from
            @alerts_search_params.end = moment(params.to).unix() if params.to

            controller.fetch
                data: @alerts_search_params

        #
        # Process the selection of an alert summary row.
        #
        on_alerts_summary_selected: (row_data) =>
            if row_data
                # Store the summary row data for later use.
                @summary_row = row_data

            alerts = new AlertCollection()
            details_list_view = new AlertsTableView
                id: 'alerts_details_table'
                collection: alerts
            controller = new FetchController
                collection: alerts
                view: details_list_view
                region: @details_list_region
                loading: true

            if 'endpoint-match' in @summary_row.alert_types
                data = _.clone @alerts_search_params
                data.iocnamehash = @summary_row.namehash
            else
                data = _.clone @alerts_search_params
                data.signature_uuid = @summary_row.uuid

            controller.fetch
                data: data
                success: =>
                    if @details_row
                        # We are refreshing.
                        details_list_view.highlight_row_for_value('uuid', @details_row.uuid)

                        # Clear the current details row.
                        @details_row = undefined
            return

        #
        # Process the selection of an alert details row.
        #
        on_alerts_details_selected: (row_data) =>
            if row_data
                @details_row = row_data

            # Clear the region.
            @details_content_region.reset()

            if row_data.type != 'endpoint-match'
                # Display everything but HX alerts.
                alert = new AlertFullModel()
                alert.uuid = row_data.uuid

                details_view = new AlertsDetailsView
                    model: alert

                controller = new FetchController
                    model: alert
                    view: details_view
                    region: @details_content_region
                    loading: true
                controller.fetch()
            else
                # Display HX alert details.
                hx_details = new HitsDetailsView
                    data: row_data
                    hits_table_name: 'alerts_details_table'
                    auto_render: false

                @details_content_region.show hx_details
                hx_details.render_details(row_data);

            return
