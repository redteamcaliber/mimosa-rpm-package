define (require) ->
    View = require 'uac/views/View'

    class DialogView extends View
        modal: ->
            @.$el.find('.modal').modal({
                backdrop: false
            })
        hide_modal: ->
            @$el.find('.modal').modal("hide")

    return DialogView