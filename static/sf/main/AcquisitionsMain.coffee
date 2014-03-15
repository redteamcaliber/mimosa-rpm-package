define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    datatables = require 'datatables'
    require 'datatables_bootstrap'

    bootstrap = require 'bootstrap'

    AcquisitionsView = require 'sf/views/AcquisitionsView'
    new AcquisitionsView()

    return