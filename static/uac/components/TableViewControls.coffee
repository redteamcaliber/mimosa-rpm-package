define (require) ->

    View = require 'uac/components/View'
    templates = require 'uac/ejs/templates'
    prev_next_template = templates['prev-next.ejs']

    class TableViewControls extends View
        initialize: ->
            view = this
            view.table = view.options.table
            log.warn "\"table\" is undefined."  unless view.table
            view.listenTo view.table, "click", view.render  if view.table isnt `undefined`
            return

        events:
            "click a.prev": "on_prev"
            "click a.next": "on_next"

        render: ->
            view = this
            view.run_once "init_template", ->

                # Only write the template once.
                view.$el.html(prev_next_template)
                $(document).keyup (ev) ->
                    if ev.ctrlKey
                        if ev.keyCode is 68 or ev.keyCode is 40 or ev.keyCode is 78
                            view.on_next()
                        else view.on_prev()  if ev.keyCode is 85 or ev.keyCode is 38 or ev.keyCode is 80
                    return

                return

            if view.table isnt `undefined`
                if view.table.is_prev() or view.table.is_prev_page()
                    view.$("a.prev").removeAttr "disabled"
                else
                    view.$("a.prev").attr "disabled", true
                if view.table.is_next() or view.table.is_next_page()

                    # Enable the next record link.
                    view.$("a.next").removeAttr "disabled"
                else

                    # Disable the next record link.
                    view.$("a.next").attr "disabled", true
            return

        on_prev: ->
            if @table isnt `undefined`
                if @table.is_prev()
                    @table.prev()
                else @table.prev_page()  if @table.is_prev_page()
            return

        on_next: ->
            if @table isnt `undefined`
                if @table.is_next()
                    @table.next()
                else @table.next_page()  if @table.is_next_page()
            return

        close: ->
            @stopListening()
            return


    TableViewControls