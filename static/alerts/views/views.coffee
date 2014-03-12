define ['backbone'], (Backbone) ->

    ###
        View to display tags search criteria.
    ###
    class TagsSearchView extends UAC.View
        el: '#alerts-search'

        initialize: ->
            if not @collection
                @collection = new Alerts.TagsCollection()
            @listenTo(@collection, 'sync', @render)

        render: ->
            context = {
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
            #console.dir context
            @apply_template Alerts, 'tags-search.ejs', context

        fetch: ->
            if @collection
                @collection.fetch()


    ###
        View for displaying alerts search criteria.
    ###
    class Alerts.SearchView extends UAC.View
        el: '#alerts-search'

        initialize: ->
            # Add a collapsable around the search view.
            @collapsable_view = new UAC.CollapsableContentView
                el: @el
                title: '<i class="fa fa-filter"></i> Filters'

            @tags = new Alerts.TagCollection()
            @tags_view = new Alerts.TagsSearchView
                collection: @tags
            @tags.fetch()

        render: ->
            console.log 'AlertsSearchView:render()'


    ###
        Alerts application view.
    ###
    class Alerts.AlertsView extends UAC.View
        initialize: ->
            @alerts_view = new Alerts.SearchView()


    {
        TagsSearchView: TagsSearchView
    }