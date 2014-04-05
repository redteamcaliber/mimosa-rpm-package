define (require) ->

    View = require 'uac/views/View'
    templates = require 'uac/ejs/templates'


    #
    # View class to display previous and next controls for a TableView.
    #
    class TableViewControls extends View
        initialize: (options) ->
            @options = options
            @table = @options.table

            console.warn "\"table\" is undefined."  unless @table
            @listenTo @table, "click", @render  if @table isnt undefined
            return

        events:
            "click a.prev": "on_prev"
            "click a.next": "on_next"

        render: =>
            @run_once "init_template", =>

                # Only write the template once.
                @apply_template(templates, 'prev-next.ejs')
                $(document).keyup (ev) =>
                    if ev.ctrlKey
                        if ev.keyCode is 68 or ev.keyCode is 40 or ev.keyCode is 78
                            @on_next()
                        else @on_prev()  if ev.keyCode is 85 or ev.keyCode is 38 or ev.keyCode is 80
                    return

                return

            if @table isnt undefined
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