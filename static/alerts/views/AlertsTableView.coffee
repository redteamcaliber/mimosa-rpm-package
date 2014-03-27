define (require) ->

    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'


    #
    # TODO:
    #
    class AlertsTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: 'Pri', mData: 'priority', sWidth: '5%', sType: 'int-html'}
                {sTitle: 'Client', mData: 'device.client.name'}
                {sTitle: 'Device', mData: 'device.type', sWidth: '5%'}
                {sTitle: 'Date', mData: 'occurred'}
                {sTitle: 'Summary', mData: 'summary'}
                {sTitle: 'Source', mData: 'src'}
                {sTitle: 'Destination', mData: 'dst'}
                {sTitle: 'Tag', mData: 'tag'}
            ]

            options.aoColumnDefs = [
                renderers.priority(0, 'shield-small')
                renderers.date_time(3)
#                alert_renderer(1)
#                count_renderer(2)
#                count_renderer(3)
#                CellRenderer.date_time_multiline(4)
#                CellRenderer.date_time_multiline(5)
            ]

            options.aaSorting = [
                [0, "asc"]
            ]

            options.oLanguage = {
                sEmptyTable: 'No matching alerts were found.'
            }

            options.iDisplayLength = 50;
            options.sDom = 'lftip'

            @$('table').addClass('table').addClass('table-bordered').addClass('table-condensed').addClass('table-hover')

            return


    AlertsTableView
