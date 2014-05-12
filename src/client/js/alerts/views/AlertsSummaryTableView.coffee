
define (require) ->
    vent = require 'uac/common/vent'
    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'

    Events = require 'alerts/common/Events'


    alert_renderer = (index) ->
        mRender: (data, type, row) ->
            alert_types = row.alert_types.join(', ')
            device_types = row.device_types.join(', ')
            return "<span style='font-weight: bold'>#{row.name}</span><br>#{alert_types}<br>#{device_types}"
        aTargets: [index]

    new_renderer = (index) ->
        mRender: (data) ->
            if data is undefined or data is null
                data
            else
                "<a class='btn btn-default shield'> #{data} </a>"
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
            options.aoColumns = [
                {sTitle: 'Pri', mData: 'highest_priority', sClass: 'priority', sType: 'int-html'}
                {sTitle: 'Name, Type(s), Device(s)', mData: 'name', sClass: 'wrap'}
                {sTitle: 'New', mData: 'tags.notreviewed', sClass: 'center', sType: 'int-html', sWidth: '12%'}
                {sTitle: 'In Prog', mData: 'tags.notreviewed', sClass: 'center', sType: 'int-html', sWidth: '12%'}
                {sTitle: 'First Seen', mData: 'first_seen', sClass: 'nowrap'}
                {sTitle: 'Last Seen', mData: 'last_seen', sClass: 'nowrap'}
            ]

            options.aoColumnDefs = [
                renderers.priority(0, 'shield')
                alert_renderer(1)
                new_renderer(2)
                in_progress_renderer(3)
                renderers.date_time_multiline(4)
                renderers.date_time_multiline(5)
            ]

            options.aaSorting = [
                [1, "asc"]
            ]

            options.oLanguage = {
                sEmptyTable: 'No matching alerts were found.'
            }

            options.iDisplayLength = 25;
            options.sDom = 'lftip'

            @listenTo(@, 'click', @on_click)

            super options

            return

        #
        # Handle a row click.
        #
        on_click: (data) ->
            vent.trigger Events.ALERTS_SUMMARY_SELECTED, data
