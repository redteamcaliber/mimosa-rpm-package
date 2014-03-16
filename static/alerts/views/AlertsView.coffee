define (require) ->
    View = require 'uac/views/View'
    SearchView = require 'alerts/views/SearchView'


    ###
        Alerts application view.
    ###
    class AlertsView extends View
        initialize: ->
            @search_view = new SearchView()

        render: ->
            @search_view.fetch()


    return AlertsView

