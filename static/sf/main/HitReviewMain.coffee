define (require) ->
    $ = require('jquery');
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    datatables = require 'datatables'
    require 'datatables_bootstrap'

    bootstrap = require 'bootstrap'
    iocviewer = require('iocviewer');
    highlighter = require('highlighter');

    ShoppingView = require 'sf/views/ShoppingView'

    shopping_view = new ShoppingView(
        el: '#shopping-div',
        standalone: false
    )
    shopping_view.render()

    return