define (require) ->
    console.log 'Initializing alerts application!'

    require 'jquery'
    require 'bootstrap'

    AlertsView = require 'alerts/views/AlertsView'

    alerts_view = new AlertsView()
    alerts_view.render();

    result = ->
        alert('Initializing app.coffee!')