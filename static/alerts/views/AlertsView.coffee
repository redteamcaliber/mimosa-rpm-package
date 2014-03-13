define (require) ->
    View = require 'uac/common/View'
    SearchView = require 'alerts/views/SearchView'


    ###
        Alerts application view.
    ###
    class AlertsView extends View
        initialize: ->
            @alerts_view = new SearchView()

    render: ->
        console.log 'AlertsSearchView:render()'

    return AlertsView

