define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'

    Events = require 'alerts/common/Events'

    class SummaryPopoverView extends Marionette.ItemView
        initialize: (options) ->
            @content = options.content

        render: (options) ->
            content = if @content then @content else ''
            el = @$el.popover(
                html: true
                content: "<span class='wrap'>#{content}</span>"
                trigger: 'hover'
                placement: 'left'
                container: 'body'
            ).data('bs.popover').tip()
            el.css
                width: 'auto'
                'max-width': '600px'

    #
    # Table view to display a list of alerts.
    #
    class AlertsTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: 'Pri', mData: 'priority', sWidth: '5%', sType: 'int-html'}
                {sTitle: 'Client', mData: 'device.client.name'}
                {sTitle: 'Device', mData: 'device.type', sWidth: '5%'}
                {sTitle: 'Date', mData: 'occurred', sClass: 'nowrap'}
                {sTitle: 'Source', mData: 'src'}
                {sTitle: 'Dest', mData: 'dst'}
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

            @listenTo @, 'click', @on_click
            @listenTo @, 'row:created', @on_row_created
            return

        #
        # Handle a row click.
        #
        on_click: (data) ->
            vent.trigger Events.ALERTS_ALERT_SELECTED, data

        #
        # Create a summary popover for each row.
        #
        on_row_created: (row, data) ->
            view = new SummaryPopoverView
                el: $(row)
                content: data.summary
            @container.add view
            view.render()


    AlertsTableView
