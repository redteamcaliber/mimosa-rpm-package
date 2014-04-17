define (require) ->

    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    Evented = require 'uac/common/mixins/Evented'
    mixin = require 'uac/common/Mixin'
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

                # Listen to status events of the TableView.
                @reg
                @listenTo vent, "TableView:#{@table_name}:status", (status) =>
                    console.debug 'TableViewControls::status'
                    console.dir status
                    @status = status
                    @render()
                @listenTo vent, "TableView:#{@table_name}:change", (changes) =>
                    @status = changes.status
                    @render()
                # Trigger a status event to obtain the current table status.
                vent.trigger "TableView:#{@table_name}:get_status"

            # Register shortcut key listeners.
            $(document).keyup (ev) =>
                if ev.ctrlKey
                    if ev.keyCode is 68 or ev.keyCode is 40 or ev.keyCode is 78
                        @on_next()
                    else if ev.keyCode is 85 or ev.keyCode is 38 or ev.keyCode is 80
                        @on_prev()
            super
            return

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
                if @status.is_prev is true
                    vent.trigger "TableView:#{@table_name}:set_prev"
            return

        on_next: ->
            if @table
                @table.next()

            if @status
                vent.trigger "TableView:#{@table_name}:set_next"
            return

        close: ->
            @stopListening()
            return


    # Mixin events.
    mixin TableViewControls, Evented

    TableViewControls