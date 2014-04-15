define (require) ->
    Marionette = require 'marionette'

    #
    # Generic dialog base class.
    #
    class DialogView extends Marionette.Layout

        onShow: ->
            console.debug 'Showing dialog view...'

            @$('.model').on 'hidden.bs.modal', =>
                # Close the view.
                @close()
            @$('.modal').on 'shown.bs.modal', =>
                @trigger 'shown'

            @modal()

        modal: ->
            @$('.modal').modal
                backdrop: false
                keyboard: true

        hide: ->
            @$('.modal').modal("hide")


    return DialogView