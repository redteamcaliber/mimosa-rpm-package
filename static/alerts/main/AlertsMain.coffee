define (require) ->
    _ = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    # Load the custom theme styles.
    require('uac/common/utils').get_styles()

    AlertsView = require 'alerts/views/AlertsView'
    new AlertsView().render()

    return