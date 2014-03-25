define (require) ->
    _ = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    # Load the custom theme styles.
    require('uac/common/utils').get_styles()

#    AlertsView = require 'alerts/views/AlertsView'
#    new AlertsView().render()

    Backbone = require 'backbone'
    Marionette = require 'marionette'
    vent = require 'uac/common/vent'

    AlertsBreadcrumbView = require 'alerts/views/AlertsBreadcrumbView'
    AlertsSearchView = require 'alerts/views/AlertsSearchView'

    AlertsSummaryCollection = require 'alerts/models/AlertSummaryCollection'
    AlertsSummaryTableView = require 'alerts/views/AlertsSummaryTableView'
    AlertsSummaryListView = require 'alerts/views/AlertsSummaryListView'

    Marionette.Region.prototype.open = (view) ->
        this.$el.hide()
        this.$el.html view.el
        this.$el.fadeIn 'slow'

    #
    # Alerts controller class.
    #
    class AlertsController extends Backbone.Marionette.Controller
        initialize: (options) ->
            @breadcrumbs_view = new AlertsBreadcrumbView()
            @filters_view = new AlertsSearchView()

            vent.on 'alerts:search:summary', (params) =>
                console.log 'alerts:search:summary'
                @show_summary_list
                    region: AlertsApp.summary_list_region
                    params: params

        show_breadcrumbs: (options) ->
            options.region.show @breadcrumbs_view

        show_filters: (options) ->
            options.region.show @filters_view

        show_summary_list: (options) ->
            console.log 'Showing summary list!'

            # User has searched for alert summary data.
            unless @summary_list_view
                console.log 'Creating summary list view...'
                @alerts_summary_collection = new AlertsSummaryCollection()
                @summary_list_view = new AlertsSummaryTableView
                    id: 'alerts-summary-table'
                    collection: @alerts_summary_collection

            data = {}
            data.tag = options.params.tags if options.params.tags
            data.client_uuid = options.params.clients if options.params.clients and options.params.clients.length > 0
            data.alert_type = options.params.types if options.params.types and options.params.types.length > 0
            data.begin = moment(options.params.from).unix() if options.params.from
            data.end = moment(options.params.to).unix() if options.params.to
            @alerts_summary_collection.fetch
                data: data

            try
                options.region.show @summary_list_view
            catch e
                console.error e.stack

        hide_filters: ->
            $(AlertsApp.regions.filters).fadeOut('slow').hide()

        hide_summary_list: ->
            $(AlertsApp.regions.summary_list_region).fadeOut('slow').hide()


    AlertsApp = new Backbone.Marionette.Application()

    AlertsApp.addRegions
        breadcrumbs_region: '#alerts-breadcrumb'
        filters_region: '#alerts-search'
        summary_list_region: '#alerts-summary-list'
        details_list_region: '#alerts-details-list'
        details_region: '#alerts-details'

    AlertsApp.on 'initialize:before', ->
        # TODO:

    AlertsApp.addInitializer ->
        alerts_controller = new AlertsController()

        alerts_controller.show_breadcrumbs region: @breadcrumbs_region
        alerts_controller.show_filters region: @filters_region
        alerts_controller.show_summary_list region: @summary_list_region

    AlertsApp.start()

    return