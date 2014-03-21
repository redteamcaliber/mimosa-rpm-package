define (require) ->
    View = require 'uac/views/View'
    DataTableView = require 'uac/views/DataTableView'

    AlertsSummaryCollection = require 'alerts/models/AlertSummaryCollection'

    templates = require 'alerts/ejs/templates'


    #
    # Alerts summary table view.
    #
    class AlertsSummaryTableView extends DataTableView
        configure: (options, settings) ->
            settings.aoColumns = [
                {sTitle: 'Priority', mData: 'highest_priority'}
                {sTitle: 'Name, Type, Device(s)', mData: 'name'}
                {sTitle: 'Open', mData: 'tags.notreviewed'}
                {sTitle: 'In Prog', mData: 'tags.notreviewed'}
                {sTitle: 'First Seen', mData: 'first_seen'}
                {sTitle: 'Last Seen', mData: 'last_seen'}
            ]

            # TODO: Add cell renderers...

            settings.aaSorting = [
                [0, "asc"]
            ]

            settings.oLanguage = {
                sEmptyTable: 'No matching alerts were found.'
            }

            settings.iDisplayLength = 25;
            settings.sDom = 'lftip'
            return

    #
    # View to display a table of alerts.
    #
    class AlertsDetailsTableView extends DataTableView
        # TODO:
        return

    #
    # View to display a list of alert rollups and individual alerts.
    #
    class AlertsListView extends View
        initialize: ->
            # Create the layout.
            @apply_template templates, 'selection-template.ejs'

            # The alert summary table.
            @alert_summaries = new AlertsSummaryCollection()
            @alert_summary_table = new AlertsSummaryTableView
                collection: @alert_summaries
            @$('#alerts-summary-list').append @alert_summary_table.el
            @listenTo @alert_summary_table, 'click', =>
                @trigger 'click'

        #
        # Render the alert summary data.
        #
        render_summary: (params) ->
            @alert_summaries.fetch
                error: =>
                    @display_error 'Error retrieving alert summaries.'

        #
        # Clean up after the view.
        #
        close: ->
            # TODO:
            @alert_summary_table.close()
            @alert_summary_table = null

    AlertsListView