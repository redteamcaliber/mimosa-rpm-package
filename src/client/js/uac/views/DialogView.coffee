define (require) ->
    Marionette = require 'marionette'

    class DialogView extends Marionette.Layout
        modal: ->
            @$('.modal').modal
                backdrop: false

        onShow: ->
            @modal()

        hide_modal: ->
            @$('.modal').modal("hide")


    return DialogView