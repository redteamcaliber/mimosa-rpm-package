define (require) ->

    TableView = require 'uac/views/TableView'
    CellRenderer = require 'uac/views/CellRenderer'

    class AlertsDetailsTableView extends TableView
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

            @$('table').addClass('table').addClass('table-bordered').addClass('table-condensed').addClass('table-hover')

            @listenTo(@, 'click', @on_click)
            return


    AlertsDetailsTableView
