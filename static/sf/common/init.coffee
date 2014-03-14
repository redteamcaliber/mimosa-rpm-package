define (require) ->
    # Initialize the host search component.
    HostTypeAheadView = require('sf/views/HostTypeAheadView')
    new HostTypeAheadView({
        el: '#host-typeahead'
    });