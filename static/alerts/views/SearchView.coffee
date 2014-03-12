define (require) ->
    UAC = require 'UAC'
    TagCollection = require 'alerts/models/TagCollection'
    TagsSearchView = require 'alerts/views/TagSearchView'


    ###
        View for displaying alerts search criteria.
    ###
    class SearchView extends UAC.View
        el: '#alerts-search'

        initialize: ->
            # Add a collapsable around the search view.
            @collapsable_view = new UAC.CollapsableContentView
                el: @el
                title: '<i class="fa fa-filter"></i> Filters'

            @tags = new TagCollection()
            @tags_view = new TagsSearchView
                collection: @tags
            @tags.fetch()

        render: ->
            console.log 'AlertsSearchView:render()'

    return SearchView