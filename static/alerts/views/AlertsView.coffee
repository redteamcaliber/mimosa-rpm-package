define (require) ->
    View = require 'uac/views/View'
    SearchView = require 'alerts/views/SearchView'


    ###
        Alerts application view.
    ###
    class AlertsView extends View

        initialize: ->
            # The view to display alert search criteria.
            @search_view = new SearchView()

            # For debugging purposes only.
            $('#remove-button').on 'click', =>
                @search_view.close()
                return

            # Load the search view.
            @search_view.fetch()
            $('#alerts-search').append(@search_view.el)


    return AlertsView

