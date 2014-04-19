define (require) ->
    Marionette = require 'marionette'
    utils = require 'uac/common/utils'
    vent = require 'uac/common/vent'


    templates = require 'alerts/ejs/templates'
    Events = require 'alerts/common/Events'

    #
    # Tag item class.
    #
    class TagItemView extends Marionette.ItemView
        tagName : 'li',
        template: templates['tag-item.ejs']

        initialize: (options) ->
            if options and options.selected
                @selected = options.selected

        serializeData: ->
            item = @model.toJSON()
            item.selected = @selected
            (
                item: item
            )

    #
    # Tags wrapper class.
    #
    class TagsView extends Marionette.CompositeView
        template: templates['tags.ejs']
        tagName: 'span'
        itemView: TagItemView

        events: {
            'click .dropdown-menu > li > a': 'on_click'
        }

        initialize: (options) ->
            # Make the selected option available for later usage.
            if options and options.selected
                @selected = options.selected

        serializeData: ->
            # Find the tag title and set the active list items.
            @collection.forEach (item) =>
                if @selected and @selected == item.get('id')
                    @title = item.get 'title'
                    return false
            title: @title

        itemViewOptions: ->
            # Make the selected option available to item views.
            selected: @selected

        appendHtml: (compositeView, itemView) ->
            # Append the items to the UL element.
            compositeView.$('ul').append(itemView.el)

        get_selected: ->
            # Return the id of the currently selected item.
            @selected

        on_click: (ev) ->
            # Update the selected item.
            selected_item = $(ev.currentTarget)
            previous = @selected
            @selected = selected_item.attr('name')

            # Render the changes.
            @render()

            data =
                previous: previous
                value: @selected
                title: @title

            # Fire an async event.
            vent.trigger Events.ALERTS_TAG_CHANGED, data

            # Fire a local event.
            @trigger 'change', data


    TagsView

