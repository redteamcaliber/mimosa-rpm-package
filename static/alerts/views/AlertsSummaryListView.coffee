define (require) ->
    moment = require 'moment'
    View = require 'uac/views/View'
    TableView = require 'uac/views/TableView'
    CellRenderer = require 'uac/views/CellRenderer'
    AlertsSummaryCollection = require 'alerts/models/AlertSummaryCollection'

    templates = require 'alerts/ejs/templates'


    priority_renderer = (index) ->
        mRender: (data) ->
            classes = undefined
            if data == 1
                classes = 'btn btn-danger'
            else if data == 2
                classes = 'btn-btn-warning'
            else if data == 3
                classes = 'btn btn-success'
            else if data == 4
                classes = 'btn btn-primary'
            else
                classes = 'btn btn-default'

            if classes
                "<a class='#{classes} shield'> #{data} </a>"
            else
                data
        aTargets: [index]

    alert_renderer = (index) ->
        mRender: (data, type, row) ->
            alert_types = row.alert_types.join(', ')
            device_types = row.device_types.join(', ')
            return "<span style='font-weight: bold'>#{row.name}</span><br>#{device_types}<br>#{alert_types}"
        aTargets: [index]

    count_renderer = (index) ->
        mRender: (data) ->
            if data
                "<a class='btn btn-default shield'> #{data} </a>"
            else
                data
        aTargets: [index]


    #
    # Alerts summary table view.
    #
    class AlertsSummaryTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: 'Pri', mData: 'highest_priority', sWidth: '5%', sClass: 'priority'}
                {sTitle: 'Name, Type, Device(s)', mData: 'name'}
                {sTitle: 'Open', mData: 'tags.notreviewed', sClass: 'center', sWidth: '10%'}
                {sTitle: 'In Prog', mData: 'tags.notreviewed', sClass: 'center', sWidth: '10%'}
                {sTitle: 'First Seen', mData: 'first_seen'}
                {sTitle: 'Last Seen', mData: 'last_seen'}
            ]

            options.aoColumnDefs = [
                priority_renderer(0)
                alert_renderer(1)
                count_renderer(2)
                count_renderer(3)
                CellRenderer.date_time_multiline(4)
                CellRenderer.date_time_multiline(5)
            ]

#            @listenTo @, 'row:callback', (row) ->
#                $('td:eq(2)', row).addClass('well')
#                $('td:eq(3)', row).addClass('well')

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
            @$el.addClass 'table-hover'

            @listenTo(@, 'click', @on_click)
            return

        #
        # Handle a row click.
        #
        on_click: (data) ->
            # Emit a signature:selected event passing the signature uuid upstream.
            @trigger 'signature:selected', data.uuid


    #
    # View to display a list of alert rollups and individual alerts.
    #
    class AlertsSummaryListView extends View
        initialize: ->
            # Create the layout.
            @apply_template templates, 'list-layout.ejs'

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
        render: (params) ->
            if params
                @block()
                data = {}
                data.tag = params.tags if params.tags
                data.client_uuid = params.clients if params.clients and params.clients.length > 0
                data.alert_type = params.types if params.types and params.types.length > 0
                data.begin = moment(params.from).unix() if params.from
                data.end = moment(params.to).unix() if params.to

                @alerts_summaries.fetch
                    data: data
                    success: =>
                        @unblock()
                    error: (collection, response) =>
                        @unblock()
                        @display_response_error 'Error retrieving alert summaries.', response

        #
        # Clean up after the view.
        #
        close: ->
            # TODO:
            @alerts_summaries_table.close()
            @alerts_summaries_table = null

    AlertsSummaryListView