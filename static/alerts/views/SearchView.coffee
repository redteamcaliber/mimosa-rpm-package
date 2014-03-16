define (require) ->
    View = require 'uac/views/View'
    uac_utils = require 'uac/common/utils'

    CollapsableContentView = require('uac/views/CollapsableContentView')
    TagCollection = require 'alerts/models/TagCollection'
    ClientCollection = require 'alerts/models/ClientCollection'
    TimeframeCollection = require 'alerts/models/TimeframeCollection'
    AlertTypeCollection = require 'alerts/models/AlertTypeCollection'

    templates = require 'alerts/ejs/templates'


    ###
    View to display tags search criteria.
    ###
    class TagsSearchView extends View
        initialize: ->
            unless @collection
                @collection = new TagCollection()
            @listenTo(@collection, 'sync', @render)

        render: ->
            context = {
                shaded_color: uac_utils.get_styles().shaded_color
                categories: [
                    (id: 'new', title: 'New')
                    (id: 'in_progress', title: 'In Progress')
                    (id: 'closed', title: 'Closed')
                ]
                category_map: {}
            }
            for tag in @collection.toJSON()
                if not context.category_map[tag.category]
                    context.category_map[tag.category] = []
                context.category_map[tag.category].push tag

            @apply_template(templates, 'search-tags.ejs', context)

        fetch: ->
            if @collection
                @collection.fetch()

    ###
    View to allow the user to select clients.
    ###
    class ClientsSearchView extends View
        initialize: ->
            unless @collection
                @collection = new ClientCollection()
            @listenTo(@collection, 'sync', @render)

        render: ->
            context = {
                clients: @collection.toJSON()
            }
            @apply_template(templates, 'search-clients.ejs', context)

        fetch: ->
            if @collection
                @collection.fetch()

    ###
    View for displaying time frame search criteria.
    ###
    class TimeframesSearchView extends View
        initialize: ->
            unless @collection
                @collection = new TimeframeCollection()
            @listenTo @collection, 'sync', @render

        render: ->
            context = {
                timeframes: @collection.toJSON()
            }
            @apply_template templates, 'search-timeframes.ejs', context

        fetch: ->
            if @collection
                @collection.fetch()

    ###
    View for displaying alert types search criteria.
    ###
    class TypesSearchView extends View
        initialize: ->
            unless @collection
                @collection = new AlertTypeCollection()
            @listenTo @collection, 'sync', @render

        render: ->
            console.dir @collection.toJSON()
            context = {
                types: @collection.toJSON()
            }
            @apply_template templates, 'search-types.ejs', context

        fetch: ->
            if @collection
                @collection.fetch()

    ###
    View for displaying alerts search criteria.
    ###
    class SearchView extends View
        el: '#alerts-search'

        events:
            'click #remove-button': 'on_remove'

        initialize: ->
            @render()

            # Add a collapsable around the search view.
            @collapsable_view = new CollapsableContentView
                el: @el
                title: '<i class="fa fa-filter"></i> Filters'

            @tags_view = new TagsSearchView el: '#search-tags'
            @clients_view = new ClientsSearchView el: '#search-clients'
            @timeframes_view = new TimeframesSearchView el: '#search-timeframes'
            @types_view = new TypesSearchView el: '#search-types'

        render: ->
            @apply_template templates, 'search-template.ejs'

        fetch: ->
            @tags_view.fetch()
            @clients_view.fetch()
            @timeframes_view.fetch()
            @types_view.fetch()

        ###
        Clear any listeners and remove the views elements from the DOM.
        ###
        close: ->
            # Remove the child views.
            @tags_view.remove()
            @clients_view.remove()
            @timeframes_view.remove()
            @types_view.remove()

            # Clear any events.
            @stopListening
            # Empty the element.
            @$el.empty()

        on_remove: ->
            @close()

    return SearchView