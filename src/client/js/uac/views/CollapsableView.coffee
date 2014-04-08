define (require) ->

    View = require 'uac/views/View'
    utils = require 'uac/common/utils'
    templates = require 'uac/ejs/templates'

    #
    # Render a collapsable content view.
    #
    # Content:
    #     - Add content to the collapsable using the collapsable.append(element) function.
    #     - Empty the content by either removing the content from the dom or calling collapsable.empty()
    #
    # Events:
    #     - Fires the "collapsed" event after the collapsable is collapsed.
    #     - Fires the "expanded event after the collapsable is expanded.
    #
    # Cleanup:
    #     - Call collapsable.remove() to cleanup this view.
    #
    class CollapsableView extends View
        initialize: (options) ->
            @name = if options and options.name then options.name else utils.random_string(10)
            @accordion_id = "#accordion-#{@name}"
            @collapse_id = "#collapse-#{@name}"
            @title = if options and options.title then options.title else undefined
            @collapsed = if options and options.collapsed then options.collapsed else false

            return

        #
        # Render the view.
        #
        render: ->
            # Remove any previous listeners.
            @get_collapse().off()

            # Run the template.
            context =
                name: @name
                title: @title
                collapsed: @collapsed

            @apply_template templates, 'collapsable.ejs', context

            if @collapsed
                @display_plus_icon()
            else
                @display_minus_icon()

            # Listen for collapse events.
            @get_collapse().on 'hide.bs.collapse',  =>
                @display_plus_icon()
                @trigger 'collapsed'
                return

            # Listen for expand events.
            @get_collapse().on 'show.bs.collapse', =>
                @display_minus_icon()
                @trigger 'expanded'
                return

            return @

        display_plus_icon: ->
            el = @get_accordion().find('.collapsable-icon')
            el.removeClass('fa-minus-square')
            el.addClass('fa-plus-square')

        display_minus_icon: ->
            el = @get_accordion().find('.collapsable-icon')
            el.removeClass('fa-plus-square')
            el.addClass('fa-minus-square')

        #
        # Retrieve the accordion element.
        #
        get_accordion: ->
            @$(@accordion_id)

        #
        # Retrieve the collapsable element.
        #
        get_collapse: ->
            @$(@collapse_id)

        #
        # Append content to the collapable.
        #
        append: (el) ->
            if el
                @$('.collapsable-content').append(el)
            return

        #
        # Empty the collapsable content.
        #
        empty: ->
            @$('.collapsable-content').empty()

        #
        # Update the title of the collapsable.
        #
        set_title: (title) ->
            @$('.collapsable-title').html(title)
            return

        #
        # Return whether the view is collapsed.
        #
        is_collapsed: ->
            not @get_collapse().hasClass('in')

        #
        # Collapse the view.
        #
        collapse: ->
            @get_collapse().collapse('hide')
            return

        #
        # Expand the view.
        #
        expand: ->
            @get_collapse().collapse('show')
            return

        #
        # Toggle the view.
        #
        toggle: ->
            @get_collapse().collapse('toggle')
            return

        #
        # Clean up the view.
        #
        close: ->
            @remove()