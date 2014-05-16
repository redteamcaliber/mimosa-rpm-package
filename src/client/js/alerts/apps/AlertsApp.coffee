define (require) ->
    Marionette = require 'marionette'
    vent = require 'uac/common/vent'
    utils = require 'uac/common/utils'
    FetchController = require 'uac/controllers/FetchController'

    templates = require 'alerts/ejs/templates'


    Events = require 'alerts/common/Events'
    AlertsBreadcrumbView = require 'alerts/views/AlertsBreadcrumbView'
    AlertsSearchView = require 'alerts/views/AlertsSearchView'

    AlertSummaryCollection = require 'alerts/models/AlertSummaryCollection'
    AlertsSummaryTableView = require 'alerts/views/AlertsSummaryTableView'

    AlertCollection = require 'alerts/models/AlertCollection'
    AlertsTableView = require 'alerts/views/AlertsTableView'

    AlertsDetailsView = require 'alerts/views/AlertsDetailsView'
    AlertFullModel = require 'alerts/models/AlertFullModel'

    HitsDetailsView = require 'sf/views/HitsDetailsView'


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
        @listenTo vent, Events.ALERTS_SEARCH, (params) =>
            # Create the summary list table.
            summaries = new AlertSummaryCollection()
            summary_list_view = new AlertsSummaryTableView
                id: 'alerts-summary-table'
                collection: summaries

            controller = new FetchController
                collection: summaries
                view: summary_list_view
                region: @layout.summary_list_region
                loading: true

            # Fetch the summary list data.
            @data = {}
            @data.tag = params.tags if params.tags
            @data.client_uuid = params.clients if params.clients and params.clients.length > 0
            @data.alert_type = params.types if params.types and params.types.length > 0
            @data.is_endpoint_match = params.is_endpoint_match is true
            @data.begin = moment(params.from).unix() if params.from
            @data.end = moment(params.to).unix() if params.to

            controller.fetch
                data: @data

        @listenTo vent, Events.ALERTS_SUMMARY_SELECTED, (row_data) =>
            alerts = new AlertCollection()
            details_list_view = new AlertsTableView
                id: 'alerts_details_table'
                collection: alerts
            controller = new FetchController
                collection: alerts
                view: details_list_view
                region: @layout.details_list_region
                loading: true

            if 'endpoint-match' in row_data.alert_types
                data = _.clone @data
                data.iocnamehash = row_data.namehash
            else
                data = _.clone @data
                data.signature_uuid = row_data.uuid

            controller.fetch
                data: data
            return

        # Display the alert details.
        @listenTo vent, Events.ALERTS_ALERT_SELECTED, (row_data) =>
            # Clear the region.
            @layout.details_content_region.reset()

            if row_data.type != 'endpoint-match'
                # Display everything but HX alerts.
                alert = new AlertFullModel()
                alert.uuid = row_data.uuid

                details_view = new AlertsDetailsView
                    model: alert

                controller = new FetchController
                    model: alert
                    view: details_view
                    region: @layout.details_content_region
                    loading: true
                controller.fetch()
            else
                # Display HX alert details.
                hx_details = new HitsDetailsView
                    data: row_data
                    hits_table_name: 'alerts_details_table'
                    auto_render: false

                @layout.details_content_region.show hx_details
                hx_details.render_details(row_data);

            return


    # Export the alerts application.
    AlertsApp