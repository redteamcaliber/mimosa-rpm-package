define (require) ->
    View = require 'uac/views/View'
    TableView = require 'uac/views/TableView'
    CellRenderer = require 'uac/views/CellRenderer'

    AlertsSummaryCollection = require 'alerts/models/AlertSummaryCollection'

    templates = require 'alerts/ejs/templates'


    #
    # Alerts summary table view.
    #
    class AlertsSummaryTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: 'Pri', mData: 'highest_priority', sWidth: '5%'}
                {sTitle: 'Name, Type, Device(s)', mData: 'name'}
                {sTitle: 'Open', mData: 'tags.notreviewed'}
                {sTitle: 'In Prog', mData: 'tags.notreviewed'}
                {sTitle: 'First Seen', mData: 'first_seen'}
                {sTitle: 'Last Seen', mData: 'last_seen'}
            ]



            # Define a multi-line date/time formatter.
            multiline_date_format = 'YYYY-MM-DD<br/>HH:mm:ss'
            date_formatter = (index) ->
                {
                    mRender: (data) ->
                        if data
                            return moment(data).format(multiline_date_format)
                        else
                            return ''
                    aTargets: [index]
                }

            # TODO: Add cell renderers...
            options.aoColumnDefs = [
                CellRenderer.priority(0)
                CellRenderer.date_time_multiline(4)
                CellRenderer.date_time_multiline(5)
            ]

#            @listenTo @, 'row:callback', (row, data) ->
#                class_name = undefined
#                switch data.highest_priority
#                    when 1 then class_name = 'danger'
#                    when 2 then class_name = 'warning'
#                    when 3 then class_name = 'info'
#                    else class_name = ''
#                # Format the priority.
#                console.dir class_name
#                $('td:eq(0)', row).addClass(class_name)

            options.aaSorting = [
                [0, "asc"]
            ]

            options.oLanguage = {
                sEmptyTable: 'No matching alerts were found.'
            }

            options.iDisplayLength = 25;
            options.sDom = 'lftip'

            @$el.addClass 'table'
            @$el.addClass 'table-bordered'
            @$el.addClass 'table-condensed'
            @$el.addClass 'table-striped'
            return

    #
    # View to display a table of alerts.
    #
#    class AlertsDetailsTableView extends TableView
#        # TODO:
#        return

    #
    # View to display a list of alert rollups and individual alerts.
    #
    class AlertsListView extends View
        initialize: ->
            # Create the layout.
            @apply_template templates, 'search-list-layout.ejs'

            # The alert summary table.
            @alerts_summaries = new AlertsSummaryCollection()
            @alerts_summaries_table = new AlertsSummaryTableView
                id: 'alerts-summary-table'
                collection: @alerts_summaries
            @$('#alerts-summary').append @alerts_summaries_table.el
            @listenTo @alerts_summaries_table, 'click', =>
                @trigger 'click'

        #
        # Render the alert summary data.
        #
        render_summary: (params) ->
            @alerts_summaries.fetch
                error: =>
                    @display_error 'Error retrieving alert summaries.'

        #
        # Clean up after the view.
        #
        close: ->
            # TODO:
            @alerts_summaries_table.close()
            @alerts_summaries_table = null

    AlertsListView