define (require) ->
    View = require 'uac/views/View'
    CollapsableContentView = require 'uac/views/CollapsableContentView'
    CollapsableView = require 'uac/views/CollapsableView'
    AlertsBreadcrumbView = require 'alerts/views/AlertsBreadcrumbView'

    AlertsSearchView = require 'alerts/views/AlertsSearchView'
    AlertsListView = require 'alerts/views/AlertsListView'


    #
    # Alerts application view.
    #
    class AlertsView extends View
        fade_time = 800

        initialize: ->
            # Enable for memory testing.  The following line limits the jQuery sizzle cache to a single element.
            #$.expr.cacheLength = 1

            # TODO: Remove this. The follow code is for memory profiling the view.
            $('#remove-button').on 'click', =>
                @close()
                $ ':button'

            return

        render: ->
            console.log 'Rendering the AlertsView...'

            @close()

            # The element to append the breadcrumbs to.
            @breadcrumb_el = $('#alerts-breadcrumb')
            @breadcrumb_el.fadeOut(0).hide()
            # The element to append to.
            @search_el = $('#alerts-search')
            @search_el.fadeOut(0).hide()
            # The element to append the summary list to.
            @list_el = $('#alerts-list')
            @list_el.fadeOut(0).hide()

            # Create the breadcrumb view.
            @breadcrumb_view = new AlertsBreadcrumbView()
            @breadcrumb_el.append @breadcrumb_view.render().el
            @breadcrumb_el.fadeIn(fade_time).show()

            # Listen for breadcrumb events.
            @listenTo @breadcrumb_view, 'breadcrumb:alerts_filters', ->
                # Show the filters.
                @breadcrumb_view.pop().render()
                @search_el.fadeIn(fade_time).show()
                @list_el.fadeOut().hide()
                return
            @listenTo @breadcrumb_view, 'breadcrumb:alerts_selection', ->
                # Show the list.
                # TODO:
                return
            @listenTo @breadcrumb_view, 'breadcrumb:alerts_details', ->
                # Show the details.
                # TODO:
                return

            # Create the alerts filters/search view.
            @search_collapsable_view = new CollapsableView
                title: '<i class="fa fa-filter"></i> Alert Filters'
            @search_el.append @search_collapsable_view.render().el

            @search_view = new AlertsSearchView()
            @search_view.render()
            @search_collapsable_view.append(@search_view.el)
            @search_el.fadeIn(fade_time).show()

            @listenTo @search_view, 'search:summary', (selections) =>
                # Display the alerts signature summary results.

                # Hide the search/filters view.
                @search_el.fadeOut().hide()

                # Add the alert selection option to the breadcrumb view.
                @breadcrumb_view.push_alert_selection().render()

                if not @list_collapsable_view
                    # Create a collapsable to wrap the alerts list view.
                    @list_collapsable_view = new CollapsableView
                        title: '<i class="fa fa-list"></i> Alert Selection'
                    @list_el.append(@list_collapsable_view.render().el)

                if not @list_view
                    # Create the alerts list view.
                    @list_view = new AlertsListView()
                    @list_collapsable_view.append(@list_view.el)

                # Run the alert summary search.
                @list_view.render_summary(selections)

                # Display the alerts summary list.
                @list_el.fadeIn(fade_time).show()
                return
            @listenTo @search_view, 'search:details', (selections) =>
                # TODO:

        #
        # Clean up the view.
        #
        close: ->
            # Cleanup the search views.
            if @breadcrumb_view
                @breadcrumb_view.close()
                @breadcrumb_view = null
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

