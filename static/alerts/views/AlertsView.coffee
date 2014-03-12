define (require) ->
    UAC = require 'UAC'
    SearchView = require 'alerts/views/SearchView'


    ###
        Alerts application view.
    ###
    class AlertsView extends UAC.View
        initialize: ->
            @alerts_view = new SearchView()

    render: ->
        console.log 'AlertsSearchView:render()'

    return AlertsView

