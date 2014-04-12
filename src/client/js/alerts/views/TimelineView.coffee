define (require) ->

    Marionette = require 'marionette'

    class TimelineView extends Marionette.ItemView

        onShow: ->
            @$('.modal').modal
                backdrop: false
            return