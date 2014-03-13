define (require) ->
    _ = require 'underscore'
    View = require 'uac/common/View'

    class SelectView extends View
        initialize: ->
            @listenTo @collection, "reset", @render  if @collection
            return

        events:
            change: "item_changed"

        render: ->
            @close()
            id_field = @options.id_field
            value_field = @options.value_field
            selected = undefined
            if @is_rendered

                # Retain the current selected items during re-render.
                selected = @get_selected()

                # Clear any existing options.
                @$el.empty()
            else

                # Rendering for the first time.
                if Array.isArray(@options.selected)
                    selected = @options.selected
                else if typeof @options.selected is "string"
                    selected = @options.selected.split(",")
                else
                    selected = []

            for model in @collection.models
                id = model.attributes[id_field]
                option = "<option value=\"" + id + "\""
                option += " selected=\"true\""  unless _.indexOf(selected, id) is -1
                option += ">"
                option += model.attributes[value_field]
                option += "</option>"
                @$el.append option

            width = @options.width
            width = "100%"  unless width
            @$el.select2 width: width

            # Fire a single change event after loading is complete.
            @item_changed null
            @is_rendered = true

            @

        close: ->
            @$el.select2 "destroy"
            return

        get_selected: ->

            # Loop through all the items and fire a change event.
            isOptionId = (@options.isOptionId is null)
            values = []
            @$("option").each ->
                if $(this).is(":selected")
                    if isOptionId
                        values.push $(this).attr("value")
                    else
                        values.push $(this).val()
                return

            values

        item_changed: (ev) ->
            @trigger "change", @get_selected()
            return


        ###
        Clear any options or selections.
        ###
        clear: ->

            # Clear the select options.
            @$el.empty()

            # Re-render the select.
            @render()
            return

    SelectView