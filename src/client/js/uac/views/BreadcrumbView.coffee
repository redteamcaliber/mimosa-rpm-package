define (require) ->

    vent = require 'uac/common/vent'
    Marionette = require 'marionette'

    templates = require 'uac/ejs/templates'

    #
    # View for displaying a breadcrumb list.
    #
    class BreadcrumbView extends Marionette.ItemView
        template: templates['breadcrumbs.ejs']
        initialize: ->
            unless @collection
                @collection = new Backbone.Collection []
            super
            return

        onRender: ->
            @delegateEvents
                'click a': 'on_click'
            return@

        push: (title, value) ->
            @collection.push
                title: title
                value: value
            return @

        pop: ->
            return @collection.pop()

        #
        # Emit a global event
        #
        on_click: (ev) ->
            vent.trigger "breadcrumb:#{$(ev.currentTarget).data 'value'}", ev
            return @

    BreadcrumbView