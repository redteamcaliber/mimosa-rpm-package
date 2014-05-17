define (require) ->
    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    resources = require 'uac/common/resources'

    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'

    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'

    AlertsEvents = require 'alerts/common/AlertsEvents'

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
            return @

        onBeforeClose: ->
            @$el.popover('destroy')


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
                {sTitle: 'UUID', mData: 'uuid', bVisible: false}
                {sTitle: 'Pri', mData: 'priority', sWidth: '5%', sType: 'int-html'}
                {sTitle: 'Client', mData: 'device.client.name'}
                {sTitle: 'Device', mData: 'device.type', sWidth: '7%'}
                {sTitle: 'Date', mData: 'occurred', sClass: 'nowrap'}
                {sTitle: 'Source', mData: 'src'}
                {sTitle: 'Dest', mData: 'dst'}
                {sTitle: 'Tag', mData: 'tag'}
            ]

            options.aoColumnDefs = [
                renderers.priority(1, 'shield-small')
                renderers.date_time(4)
                tag_renderer(7)
            ]

            options.aaSorting = [
                [1, "asc"]
            ]

            options.oLanguage = {
                sEmptyTable: 'No matching alerts were found.'
            }

            options.iDisplayLength = 50;
            options.sDom = 'lftip'

            @$('table').addClass('table').addClass('table-bordered').addClass('table-condensed').addClass('table-hover')

            @listenTo @, 'click', @on_click
            @listenTo @, 'row:created', @on_row_created

            @listenTo vent, AlertsEvents.ALERTS_TAG_CREATED, @on_alert_tag_created
            @listenTo vent, StrikeFinderEvents.SF_TAG_CREATE, @on_sf_tag_created
            return

        #
        # Handle a row click.
        #
        on_click: (data) ->
            vent.trigger AlertsEvents.ALERTS_ALERT_SELECTED, data

        #
        # Create a summary popover for each row.
        #
        on_row_created: (row, data) ->
            view = new SummaryPopoverView
                el: $(row)
                content: data.summary
            @container.add view
            view.render()

        #
        # Update the tag of the corresponding row when an alert tag is applied.
        #
        on_alert_tag_created: (data) ->
            tag = resources[data.value]
            value = "<span title='#{tag.description}'>#{tag.title}</span>"
            @update_row 'uuid', data.uuid, 'tag', value, 6

        #
        # Update the tag of the corresponding row when a new StrikeFinder tag is applied.
        #
        on_sf_tag_created: (data) ->
            tag = resources[data.tagname]
            value = "<span title='#{tag.description}'>#{tag.title}</span>"
            @update_row 'uuid', data.rowitem_uuid, 'tag', value, 6


    AlertsTableView
