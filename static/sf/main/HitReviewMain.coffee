define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    ShoppingView = require 'sf/views/ShoppingView'

    shopping_view = new ShoppingView(
        el: '#shopping-div',
        standalone: false
    )
    shopping_view.render()

    return