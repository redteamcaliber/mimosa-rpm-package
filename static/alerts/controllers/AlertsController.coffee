define (require) ->

    class AlertsController extends Backbone.Marionette.Controller
        ShowAlertsSearch: (options) ->
            options.region.show(new AlertsSearchView())

    return AlertsController