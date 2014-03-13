define (require) ->
    View = require 'uac/common/View'
    CollapsableContentView = require('uac/common/CollapsableContentView')
    TagCollection = require 'alerts/models/TagCollection'
    TagsSearchView = require 'alerts/views/TagSearchView'


    ###
        View for displaying alerts search criteria.
    ###
    class SearchView extends View
        el: '#alerts-search'

        initialize: ->
            # Add a collapsable around the search view.
            @collapsable_view = new CollapsableContentView
                el: @el
                title: '<i class="fa fa-filter"></i> Filters'

            @tags = new TagCollection()
            @tags_view = new TagsSearchView
                collection: @tags
            @tags.fetch()

        render: ->
            console.log 'AlertsSearchView:render()'

    return SearchView