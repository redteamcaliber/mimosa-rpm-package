define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'

    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'

    resources = require 'uac/common/resources'
    Events = require 'alerts/common/Events'

    class SummaryPopoverView extends Marionette.ItemView
        initialize: (options) ->
            @content = options.content

        render: ->
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

    tag_renderer = (index) ->
        (
            mRender: (data) ->
                if data
                    tag = resources[data]
                    if tag
                        return "<span title='#{tag.description}'>#{tag.title}</span>"
                    else
                        return data
                else
                    return data
            aTargets: [index]
        )

    #
    # Table view to display a list of alerts.
    #
    class AlertsTableView extends TableView
        initialize: (options) ->
            super options

            options.aoColumns = [
                {sTitle: 'Pri', mData: 'priority', sWidth: '5%', sType: 'int-html'}
                {sTitle: 'Client', mData: 'device.client.name'}
                {sTitle: 'Device', mData: 'device.type', sWidth: '7%'}
                {sTitle: 'Date', mData: 'occurred', sClass: 'nowrap'}
                {sTitle: 'Source', mData: 'src'}
                {sTitle: 'Dest', mData: 'dst'}
                {sTitle: 'Tag', mData: 'tag'}
            ]

            options.aoColumnDefs = [
                renderers.priority(0, 'shield-small')
                renderers.date_time(3)
                tag_renderer(6)
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
