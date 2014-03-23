define (require) ->
    View = require 'uac/views/View'
    CollapsableContentView = require 'uac/views/CollapsableContentView'
    CollapsableView = require 'uac/views/CollapsableView'
    BreadcrumbView = require 'uac/views/BreadcrumbView'

    AlertsSearchView = require 'alerts/views/AlertsSearchView'
    AlertsListView = require 'alerts/views/AlertsListView'


    #
    # Alerts application view.
    #
    class AlertsView extends View
        initialize: ->
            # Enable for memory testing.  The following line limits the jQuery sizzle cache to a single element.
            #$.expr.cacheLength = 1

            # TODO: Remove this. The follow code is for memory profiling the view.
            $('#remove-button').on 'click', =>
                @close()
                $ ':button'

        render: ->
            console.log 'Rendering the AlertsView...'

            @close()

            # The element to append the breadcrumbs to.
            breadcrumb_el = $('#alerts-breadcrumb')
            # The element to append to.
            search_el = $('#alerts-search')
            # The element to append the summary list to.
            list_el = $('#alerts-list')

            # Create the breadcrumb view.
            @breadcrumb_view = new BreadcrumbView()
            @breadcrumb_view.push '<i class="fa fa-exclamation-circle"></i> Alerts'
            @breadcrumb_view.push '<i class="fa fa-filter"></i> Filters', '/filters'
            breadcrumb_el.append @breadcrumb_view.render().el

                # Create a collapsable to wrap the alerts search view.
            @search_collapsable_view = new CollapsableView
                title: '<i class="fa fa-filter"></i> Filters'
            search_el.append @search_collapsable_view.render().el

            # Create the alerts search view.
            @search_view = new AlertsSearchView()
            @search_view.render()
            @search_collapsable_view.append(@search_view.el)

            @listenTo @search_view, 'search', (selections) =>
                @search_collapsable_view.collapse()
                search_el.fadeOut().hide()
                @breadcrumb_view.push('<i class="fa fa-list"></i> Alert Selection', 'sdfsdf').render()

                if not @list_collapsable_view
                    # Create a collapsable to wrap the alerts list view.
                    @list_collapsable_view = new CollapsableView
                        title: '<i class="fa fa-list"></i> Alert Selection'
                    list_el.append(@list_collapsable_view.render().el)

                if not @list_view
                    # Create the alerts list view.
                    @list_view = new AlertsListView()
                    @list_collapsable_view.append(@list_view.el)

                # TODO: Search for summaries.
                @list_view.render_summary(selections)

        #
        # Clean up the view.
        #
        close: ->
            # Cleanup the search views.
            if @search_view
                @search_view.close()
                @search_view = null
            if @search_collapsable_view
                @search_collapsable_view.remove()
                @search_collapsable_view = null
            if @list_view
                @list_view.close()
                @list_view = null
            if @list_collapsable_view
                @list_collapsable_view.close()
                @list_collapsable_view = null

            @remove()

    return AlertsView

