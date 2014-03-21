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
            if options
                @name = options.name ? utils.random_string(10)
                @accordion_id = "#accordion-#{@name}"
                @collapse_id = "#collapse-#{@name}"
                @title = options.title ? undefined
                @collapsed = options.collapsed ? false
            else
                # Generate a unique name for this view.
                @name = utils.random_string(10)
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

            # Listen for collapse events.
            @get_collapse().on 'hide.bs.collapse',  =>
                el = @get_accordion().find('.fa-minus-square')
                el.removeClass('fa-minus-square')
                el.addClass('fa-plus-square')
                @trigger 'collapsed'

            # Listen for expand events.
            @get_collapse().on 'show.bs.collapse', =>
                el = @get_accordion().find('.fa-plus-square')
                el.removeClass('fa-plus-square')
                el.addClass('fa-minus-square')
                @trigger 'expanded'

            return @

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
            @get_collapse().hasClass('in')

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