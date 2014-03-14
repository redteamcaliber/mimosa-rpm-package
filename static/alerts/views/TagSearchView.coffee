define (require) ->

    View = require 'uac/views/View'
    templates = require 'alerts/ejs/templates'

    #TagCollection = require 'alerts/models/TagCollection'

    ###
        View to display tags search criteria.
    ###
    class TagsSearchView extends View
        el: '#alerts-search'

        initialize: ->
            if not @collection
                @collection = new TagCollection()
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

            @apply_template(templates, 'tags-search.ejs', context)

        fetch: ->
            if @collection
                @collection.fetch()


    TagsSearchView