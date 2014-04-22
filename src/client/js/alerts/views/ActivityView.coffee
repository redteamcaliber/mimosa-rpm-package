define (require) ->

    Marionette = require 'marionette'
    marked = require 'marked'

    templates = require 'alerts/ejs/templates'


    #
    # UAC view to display activities.
    #
    class ActivityView extends Marionette.Layout
        template: templates['activity-layout.ejs']

        onRender: ->
            console.log marked('I am using __markdown__.')


    ActivityView