define (require) ->
    Marionette = require 'marionette'

    DialogView = require 'uac/views/DialogView'
    TableView = require 'uac/views/TableView'

    templates = require 'alerts/ejs/templates'


    #
    # Map of OS change types to templates.
    #
    template_map =
        apicall: 'timeline-apicall.ejs'
        file: 'timeline-file.ejs'
        os: 'timeline-os.ejs'
        os_monitor: 'timeline-os-monitor.ejs'
        monitor: 'timeline-monitor.ejs'
        mutex: 'timeline-mutex.ejs'
        network: 'timeline-network.ejs'
        process: 'timeline-process.ejs'
        regkey: 'timeline-regkey.ejs'


    #
    # Process info helper.
    #
    render_process_info = (process_info) ->
        template = templates['timeline-processinfo.ejs']
        return template
            processinfo: process_info

    #
    # Render an Underscore template.
    #
    details_template_renderer = (index) ->
        mRender: (data, type, row) ->
            try
                template = template_map[row.type]
                if not template
                    template = 'timeline-default.ejs'
                context =
                    data: data
                    type: type
                    row: row
                    processinfo: render_process_info
                return templates[template](context)
            catch e
                return e
        aTargets: [index]

    mode_renderer = (index) ->
        mRender: (data, type, row) ->
            if row.mode
                return row.mode
            else
                return ''
        aTargets: [index]



    class TimelineTable extends TableView
        initialize: (options) ->
            options.aoColumns = [
                {sTitle: 'Time', mData: 'timestamp', sWidth: '8%'}
                {sTitle: 'Type', mData: 'type', sClass: 'wrap', sWidth: '10%'}
                {sTitle: 'Mode', mData: 'type', sWidth: '10%'}
                {sTitle: 'Details (Path/Message/Protocol/Hostname/Qtype/ListenPort etc.)', mData: 'type'}
            ]

            options.aaSorting = [
                [0, "asc"]
            ]

            options.oLanguage = {
                sEmptyTable: 'No OS changes were found.'
            }

            options.aoColumnDefs = [
                mode_renderer(2)
                details_template_renderer(3)
            ]

            options.iDisplayLength = 1000
            options.asStripeClasses = ['timeline-row']
            options.sDom = 'iftS'
            options.sScrollY = '750px'
            options.bDeferRender = true
            options.oScroller =
                heights:
                    row: 150
            super

            @listenTo @, 'click', (data) ->
                console.dir data


        create_table_el: ->
            table_el = super
            table_el.attr('cellspacing', 0)
            table_el.attr('cellpadding', 0)
            table_el

    class TimelineView extends DialogView
        template: templates['timeline.ejs']

        regions:
            timeline_region: '.timeline-region'

        initialize: ->
            @listenToOnce @, 'shown', @on_shown
            super

        onShow: ->
            @timeline_table = new TimelineTable
                collection: @collection
            @timeline_region.show @timeline_table
            super
            return

        on_shown: ->
            # Update the column widths, required with the scroll plugin.
            @timeline_table.adjust_column_sizing()

        close: ->
            @timeline_table.close()
            @timeline_table = undefined
            super


    TimelineView