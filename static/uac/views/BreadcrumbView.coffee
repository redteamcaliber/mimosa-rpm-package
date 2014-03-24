define (require) ->

    View = require 'uac/views/View'

    templates = require 'uac/ejs/templates'

    #
    # View for displaying a breadcrumb list.
    #
    class BreadcrumbView extends View
        initialize: ->
            unless @collection
                @collection = new Backbone.Collection []
            return

        render: ->
            context =
                items: @collection.toJSON()
            @apply_template templates, 'breadcrumbs.ejs', context
            @delegateEvents
                'click a': 'on_click'
            return@

        push: (title, value) ->
            @collection.push
                title: title
                value: value
            return @

        pop: ->
            @collection.pop()
            return @

        on_click: (ev) ->
            @trigger "breadcrumb:#{$(ev.currentTarget).data 'value'}", ev
            return @

        close: ->
            @remove()
            return @

    BreadcrumbView