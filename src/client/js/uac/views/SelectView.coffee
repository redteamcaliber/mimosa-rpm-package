define (require) ->
    _ = require 'underscore'
    Marionette = require 'marionette'
    select2 = require 'select2'

    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'
    Evented = require 'uac/common/mixins/Evented'

    templates = require 'uac/ejs/templates'


    class SelectItemView extends Marionette.ItemView
        tagName: 'option'
        template: templates['select-item.ejs']

        serializeData: ->
            item:
                value: @model.get @value_field

        onRender: ->
            if @id_field
                id_value = @model.get(@id_field)
                @$el.attr 'name', id_value

            selected = if id_value then id_value else @model.get @value_field

            if Array.isArray(@selected) and selected in @selected
                @$el.attr('selected', true)
            else if selected == @selected
                @$el.attr('selected', true)

    class SelectView extends Marionette.CollectionView
        itemView: SelectItemView
        tagName: 'span'

        events:
            'change select': "item_changed"

        initialize: (options) ->
            @select_el = $('<select>')
            @$el.append @select_el

            if options
                if options.multiple
                    @select_el.attr('multiple', true)
                if options.select_options
                    @select_options = options.select_options
                if options.id_field
                    @id_field = options.id_field
                if options.value_field
                    @value_field = options.value_field
                if options.selected
                    @selected = options.selected

        buildItemView: (item, ItemViewType, itemViewOptions) ->
            options = _.extend({model: item}, itemViewOptions)

            view = new ItemViewType(options)
            view.id_field = @id_field
            view.value_field = @value_field
            view.selected = @selected

            view

        appendBuffer: (collectionView, buffer) ->
            collectionView.select_el.append(buffer);

        beforeRender: ->
            if @is_rendered
                # Retain the current selected items during re-render.
                @selected = @get_selected()

        onRender: ->
            @select_el.select2 @select_options

            # Fire a single change event after loading is complete.
            @item_changed()

            @is_rendered = true

            @

        beforeClose: ->
            @select_el.select2 "destroy"
            return

        get_selected: ->
            # Loop through all the items and fire a change event.
            values = []
            @$('option').each ->
                if $(this).is(':selected')
                    if $(this).attr('name')
                        values.push $(this).attr('name')
                    else
                        values.push $(this).val()
                return
            values

        item_changed: ->
            @trigger "change", @get_selected()
            return


        #
        # Clear any options or selections.
        #
        clear: ->
            # Clear the select options.
            @select_el.empty()
            @selected = undefined

            # Re-render the select.
            @render()
            return


    utils.mixin SelectView, Evented