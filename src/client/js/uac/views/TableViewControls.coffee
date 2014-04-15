define (require) ->

    Marionette = require 'marionette'

    vent = require 'uac/common/vent'
    templates = require 'uac/ejs/templates'


    #
    # View class to display previous and next controls for a TableView.
    #
    class TableViewControls extends Marionette.ItemView
        template: templates['prev-next.ejs']

        events:
            "click a.prev": "on_prev"
            "click a.next": "on_next"

        initialize: (options) ->
            @options = options
            if options.table
                @table = options.table

            if @table
                # Listen to a table directly.
                @listenTo @table, "click", @render

            # Register key listeners.
            $(document).keyup (ev) =>
                if ev.ctrlKey
                    if ev.keyCode is 68 or ev.keyCode is 40 or ev.keyCode is 78
                        @on_next()
                    else @on_prev()  if ev.keyCode is 85 or ev.keyCode is 38 or ev.keyCode is 80

            super
            return

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
            return

        on_prev: ->
            if @table isnt undefined
                if @table.is_prev()
                    @table.prev()
                else @table.prev_page()  if @table.is_prev_page()
            return

        on_next: ->
            if @table isnt undefined
                if @table.is_next()
                    @table.next()
                else @table.next_page()  if @table.is_next_page()
            return

        close: ->
            @stopListening()
            return


    TableViewControls