window.require =
    baseUrl: "/static",
    paths:
        async: 'lib/async/async'
        backbone: 'lib/backbone/backbone'
        bootstrap: 'lib/bootstrap/js/bootstrap'
        bootstrap_growl: 'lib/bootstrap-growl/jquery.bootstrap-growl'
        blockui: 'lib/blockui/jquery.blockUI'
        datatables: 'lib/datatables/jquery.dataTables'
        datatables_bootstrap: 'js/datatables'
        highlighter: 'js/jQuery.highlighter'
        iocviewer: 'js/jquery.iocViewer'
        jquery: 'lib/jquery/jquery'
        moment: 'lib/moment/moment'
        select2: 'lib/select2/select2'
        typeahead: 'lib/typeahead.js/typeahead'
        underscore: 'lib/underscore/underscore'
        'underscore.string': 'lib/underscore.string/underscore.string'
    shim: {
        jquery: {
            exports: '$'
        }
#        backbone: {
#            deps: ['underscore', 'jquery']
#            exports: 'Backbone'
#        }
        bootstrap: {
            deps: ['jquery']
            exports: 'bootstrap'
        }
        bootstrap_growl: {
            deps: ['jquery']
            exports: '$.bootstrapGrowl'
        }
        highlighter: {
            deps: ['jquery']
            exports: '$.fn.highlighter'
        }
        iocviewer: {
            deps: ['jquery']
            exports: '$.fn.iocViewer'
        }
        select2: {
            deps: ['jquery'],
            exports: 'Select2'
        }
        typeahead: {
            deps: ['jquery']
            exports: 'jQuery.fn.typeahead'
        }
        underscore: {
            exports: '_'
        }
    }
    enforceDefine: true