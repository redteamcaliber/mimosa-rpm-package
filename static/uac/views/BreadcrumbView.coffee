define (require) ->

    View = require 'uac/views/View'

    templates = require 'uac/ejs/templates'

    #
    # View for displaying a breadcrumb list.
    #
    class BreadcrumbView extends View
        initialize: (options) ->
            unless @collection
                @collection = new Backbone.Collection []
            return

        render: ->
            context =
                items: @.collection.toJSON()
            @apply_template templates, 'breadcrumbs.ejs', context

            return@

        push: (title, href) ->
            @.collection.push
                title: title
                href: href
            return @

    BreadcrumbView