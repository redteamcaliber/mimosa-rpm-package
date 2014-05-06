define (require) ->
    $ = require 'jquery'
    Backbone = require 'backbone'

    #
    # Wrap an element with a collapsable view.
    #
    # NOTE: This class is DEPRECATED, use the uac/views/CollapsableView instead.
    #
    class CollapsableContentView extends Backbone.View
        initialize: (options) ->
            if not @name
                @name = this.cid

            @collapsed = options.collapsed || @$el.hasClass('collapsed')

            if options.title
                @title = options.title
            else
                @title = '&nbsp'

            @title_class = options.title_class

            @display_toggle = options.display_toggle isnt false

            @render()

        render: ->
            # Create the accordion inner div.
            panel_body = $(document.createElement('div'))
            panel_body.addClass('panel-body')
            @$el.wrap(panel_body)
            panel_body = @$el.parent()

            # Create the accordion body.
            panel_collapse = $(document.createElement('div'))
            panel_collapse.attr('id', 'collapse-' + @name)
            panel_collapse.addClass('panel-collapse')
            panel_collapse.addClass('collapse')
            unless @collapsed
                panel_collapse.addClass('in')
            panel_body.wrap(panel_collapse)
            panel_collapse = panel_body.parent()

            # Create the accordion group div.
            panel = $(document.createElement('div'))
            panel.addClass('panel')
            panel.addClass('panel-default')
            panel.css('margin-bottom', '10px')
            panel_collapse.wrap(panel)
            panel = panel_collapse.parent()

            # Create the accordion div.
            panel_group = $(document.createElement('div'))
            panel_group.attr('id', "accordion-#{@name}")
            panel_group.addClass('panel-group')
            panel.wrap(panel_group)

            # Create the title.
            title_span = $(document.createElement('span'))
            title_span.attr('id', @name + '-title')
            if @title_class
                title_span.addClass(@title_class)
            if @title
                title_span.html(@title)

            icon = undefined
            if @display_toggle
                # Create the icon.
                icon = $(document.createElement('i'))
                if @collapsed
                    icon.addClass('fa fa-plus-square')
                else
                    icon.addClass('fa fa-minus-square')
                icon.addClass('fa-lg')
                icon.addClass('pull-right')

            # Create the accordion anchor.
            anchor = $(document.createElement('a'))
            anchor.addClass('accordion-toggle')
            anchor.attr('data-toggle', 'collapse')
            anchor.attr('data-parent', @name + '-accordion')
            anchor.attr('href', '#collapse-' + @name)
            anchor.attr('title', 'Click to Expand or Collapse')
            anchor.css('text-decoration', 'none')

            anchor.append(title_span)
            if icon
                anchor.append icon

            # Create the panel header.
            panel_title = $(document.createElement('h4'))
            panel_title.addClass('panel-title')
            panel_title.append(anchor)

            # Create the accordion heading div.
            panel_heading = $(document.createElement('div'))
            panel_heading.addClass('panel-heading')
            panel_heading.append(panel_title)

            panel.prepend(panel_heading)

            @get_collapse().on 'hide.bs.collapse',  =>
                el = @get_accordion().find('.fa-minus-square')
                el.removeClass('fa-minus-square')
                el.addClass('fa-plus-square')

            @get_collapse().on 'show.bs.collapse', =>
                el = @get_accordion().find('.fa-plus-square')
                el.removeClass('fa-plus-square')
                el.addClass('fa-minus-square')

            return @

        get_accordion: ->
            id = "#accordion-#{@name}"
            $(id)

        show: ->
            # Show the accordion decorator.
            @get_accordion().fadeIn().show()

        hide: ->
            # Hide the accordion decorator.
            @get_accordion().fadeOut().hide()

        set: (key, value) ->
            if key && key == 'title'
                id = "##{@name}-title"
                $(id).html(value)

        get_collapse: ->
            id = "#collapse-#{@name}"
            $(id)

        collapsed: ->
            @get_collapse().hasClass('in')

        collapse: ->
            @get_collapse().removeClass('in')

        expand: ->
            @get_collapse().addClass('in')

        toggle: ->
            @get_collapse().collapse('toggle')

        close: ->
            @get_collapse().off()

    return CollapsableContentView