define (require) ->

    Bootstrap = require 'bootstrap'
    Marionette = require 'marionette'


    #
    # View class to display a textual representation of the IOC expression.
    #
    class ExpressionView extends Marionette.View
        render: ->
            exp_string = @model.get('exp_string')
            tokens = exp_string.split(/(AND)|(OR)/)

            text = ''
            _.each tokens, (token) ->
                if not token
                    #
                else if token == 'AND' or token == 'OR'
                    text += token + '\n'
                else
                    text += token

            popover = @$el.popover
                html: true
                trigger: 'hover'
                content: '<pre style="border: 0; margin: 2px; font-size: 85%; overflow: auto">' + text + '</pre>'
                placement: 'left'
                container: 'body'
            popover.data('bs.popover').tip().addClass('expression-popover')
            return @

        onBeforeClose: ->
            @$el.popover('destroy')


    return ExpressionView