define (require) ->
    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    datatables = require 'datatables'
    require 'datatables_bootstrap'

    bootstrap = require 'bootstrap'
    iocviewer = require('iocviewer');
    highlighter = require('highlighter');

    HitsView = require 'sf/views/HitsView'
    hits_view = new HitsView()

    if StrikeFinder.rowitem_uuid
        hits_view.fetch(rowitem_uuid: StrikeFinder.rowitem_uuid)
    else if StrikeFinder.identity
        hits_view.fetch(identity: StrikeFinder.identity)
    else
        hits_view.fetch()

    return
