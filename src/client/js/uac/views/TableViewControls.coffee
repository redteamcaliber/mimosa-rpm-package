define (require) ->

    Marionette = require 'marionette'
    utils = require 'uac/common/utils'
    TableView = require 'uac/views/TableView'
    vent = require 'uac/common/vent'
    Evented = require 'uac/common/mixins/Evented'
    templates = require 'uac/ejs/templates'


    #
    # View class to display previous and next controls for a TableView.
    #
    class TableViewControls extends Marionette.ItemView
        template: templates['prev-next.ejs']

        events:
            "click a.prev": "on_prev"
            "click a.next": "on_next"

        #
        # Initialize the table controls.
        #
        initialize: (options) ->
            if options and options.table
                # Listen to a table instance directly.
                @table = options.table
                # Render the controls whenever a user clicks on a table row.
                @listenTo @table, "click", @render

            if options.table_name
                # Listen to global events for a table.
                @table_name = options.table_name

                # Update the controls whenever the source table changes.
                @registerAsync
                    constructorName: TableView
                    instanceName: @table_name
                    eventName: 'change'
                    handler: (status) =>
                        console.debug "Received status from table: #{TableView.prototype.constructor.name}:#{@table_name}"
                        console.debug JSON.stringify status
                        @status = status
                        @render()

                # Attempt to retrieve the current status of the table and render.  This will only work if the table has
                # already been created.
                @status = @requestSync
                    constructorName: TableView
                    instanceName: @table_name
                    eventName: 'status'

                if @status
                    console.debug "Retrieved status from table: #{TableView.prototype.constructor.name}:#{@table_name}"
                    console.debug JSON.stringify @status
                    @render()

            # Register shortcut key listeners.
            $(document).keyup @on_keyup

            super
            return

        #
        # Handle key up event.
        #
        on_keyup: (ev) =>
            if ev.ctrlKey
                if ev.keyCode is 68 or ev.keyCode is 40 or ev.keyCode is 78
                    @on_next()
                else if ev.keyCode is 85 or ev.keyCode is 38 or ev.keyCode is 80
                    @on_prev()

        #
        # Update the controls based on the current status.
        #
        onRender: =>
            if @table
                if @table.is_prev() or @table.is_prev_page()
                    @$("a.prev").removeAttr "disabled"
                else
                    @$("a.prev").attr "disabled", true

                if @table.is_next() or @table.is_next_page()
                    # Enable the next record link.
                    @$("a.next").removeAttr "disabled"
                else
                    # Disable the next record link.
                    @$("a.next").attr "disabled", true
            else if @status
                if @status.is_prev or @status.is_prev_page
                    @$("a.prev").removeAttr "disabled"
                else
                    @$("a.prev").attr "disabled", true

                if @status.is_next or @status.is_next_page
                    # Enable the next record link.
                    @$("a.next").removeAttr "disabled"
                else
                    # Disable the next record link.
                    @$("a.next").attr "disabled", true
            return

        on_prev: ->
            if @table
                @table.prev()

            if @status
                @fireAsync
                    constructorName: TableView
                    instanceName: @table_name
                    eventName: 'set_prev'
            return

        on_next: ->
            if @table
                @table.next()

            if @status
                @fireAsync
                    constructorName: TableView
                    instanceName: @table_name
                    eventName: 'set_next'
            return

        onClose: ->
            $(document).off('keyup', @on_keyup)

    # Mixin events.
    utils.mixin TableViewControls, Evented