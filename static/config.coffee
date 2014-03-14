window.require =
    baseUrl: "/static",
    paths:
        async: 'lib/async/async'
        backbone: 'lib/backbone/backbone'
        bootstrap: 'lib/bootstrap/bootstrap'
        blockui: 'lib/blockui/jquery.blockUI'
        datatables: 'lib/datatables/jquery.dataTables'
        datatables_bootstrap: 'js/datatables'
        highlighter: 'lib/highlighter/jQuery.highlighter'
        iocviewer: 'js/jquery.iocViewer'
        jquery: 'lib/jquery/jquery'
        moment: 'lib/moment/moment'
        select2: 'lib/select2/select2'
        typeahead: 'lib/typeahead.js/typeahead'
        underscore: 'lib/underscore/underscore'
        underscore_string: 'lib/underscore.string/underscore.string'
        uac_init: 'uac/common/init'
    shim:
        'bootstrap': (
            deps: ['jquery']
            exports: 'Bootstrap'
        )
        'backbone': (
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        ),
        datatables: (
            deps: ['jquery']
            exports: 'DataTable'
        )
        datatables_bootstrap: (
            deps: ['datatables']
        )
        'jquery': (
            exports: '$'
        ),
        'typeahead': (
            deps: ['jquery']
        )
        'underscore': (
            exports: '_'
        )
        underscore_string : (
            deps: ['underscore']
        )
    deps: ['bootstrap', 'underscore_string', 'backbone', 'datatables_bootstrap', 'typeahead', 'uac/common/init', 'sf/common/init']
    callback: ->
        # Setup underscore.string.
        _.mixin(_.str.exports())