define (require) ->
    vent = require 'uac/common/vent'
    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'


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

    in_progress_renderer = (index) ->
        mRender: (data, type, row) ->
            count = row.tags.investigating + row.tags.escalate + row.tags.reportable
            "<a class='btn btn-default shield'> #{count} </a>"
        aTargets: [index]


    #
    # Alerts summary table view.
    #
    class AlertsSummaryTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: 'Pri', mData: 'highest_priority', sWidth: '5%', sClass: 'priority', sType: 'int-html'}
                {sTitle: 'Name, Type, Device(s)', mData: 'name'}
                {sTitle: 'Open', mData: 'tags.notreviewed', sClass: 'center', sWidth: '10%', sType: 'int-html'}
                {sTitle: 'In Prog', mData: 'tags.notreviewed', sClass: 'center', sWidth: '10%', sType: 'int-html'}
                {sTitle: 'First Seen', mData: 'first_seen'}
                {sTitle: 'Last Seen', mData: 'last_seen'}
            ]

            options.aoColumnDefs = [
                renderers.priority(0, 'shield')
                alert_renderer(1)
                count_renderer(2)
                in_progress_renderer(3)
                renderers.date_time_multiline(4)
                renderers.date_time_multiline(5)
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

        #
        # Handle a row click.
        #
        on_click: (data) ->
            vent.trigger 'alerts:summary_selected', data
