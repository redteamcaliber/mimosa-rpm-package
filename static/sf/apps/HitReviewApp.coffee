define (require) ->
    $ = require 'jquery'
    bootstrap = require 'bootstrap'
    ShoppingView = require 'sf/views/ShoppingView'
    HostTypeAheadView = require('sf/views/HostTypeAheadView');

    console.log 'Initializing the HitReviewApp'

    shopping_view = new ShoppingView()
    shopping_view.render()

    # Initialize the host search component.
    new HostTypeAheadView({
        el: '#host-typeahead'
    });

    return