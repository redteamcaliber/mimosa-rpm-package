define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    datatables = require 'datatables'
    require 'datatables_bootstrap'

    bootstrap = require 'bootstrap'
    iocviewer = require('iocviewer');
    highlighter = require('highlighter');

    SuppressionsView = require 'sf/views/SuppressionsView'
    suppressions_view = new SuppressionsView()
    suppressions_view.render()

    return