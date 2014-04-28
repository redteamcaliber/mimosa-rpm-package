window.require =
    baseUrl: "/static/js/raw",
    paths:
        ace: 'lib/ace'
        async: 'lib/async/async'
        backbone: 'lib/backbone/backbone'
        'backbone.babysitter': 'lib/backbone.babysitter/backbone.babysitter'
        'backbone.wreqr': 'lib/backbone.wreqr/backbone.wreqr'
        bootstrap: 'lib/bootstrap/js/bootstrap'
        bootstrap_growl: 'lib/bootstrap-growl/jquery.bootstrap-growl'
        blockui: 'lib/blockui/jquery.blockUI'
        chai: 'lib/chai/chai'
        'chai-jquery': 'lib/chai-jquery/chai-jquery'
        cocktail: 'lib/cocktail/Cocktail'
        datatables: 'lib/datatables/jquery.dataTables'
        datatables_bootstrap: 'js/datatables'
        'datatables-fixedheader': 'js/dataTables.fixedHeader'
        'datatables-scroller': 'js/dataTables.scroller'
        highlighter: 'js/jQuery.highlighter'
        iocviewer: 'js/jquery.iocViewer'
        jquery: 'js/jquery-1.9.1'
        marionette: 'lib/marionette/backbone.marionette'
        marked: "lib/marked/marked"
        mocha: 'lib/mocha/mocha'
        moment: 'lib/moment/moment'
        select2: 'lib/select2/select2'
        typeahead: 'lib/typeahead.js/typeahead.bundle'
        underscore: 'lib/underscore/underscore'
        'underscore.string': 'lib/underscore.string/underscore.string'
        bootstrap_datepicker: 'lib/eonasdan-bootstrap-datetimepicker/bootstrap-datetimepicker.min'
    shim: {
        jquery: {
            exports: '$'
        }
        bootstrap: {
            deps: ['jquery']
            exports: 'bootstrap'
        }
        bootstrap_growl: {
            deps: ['jquery']
            exports: '$.bootstrapGrowl'
        }
        bootstrap_datepicker: {
          deps: ['jquery']
          exports: '$'
        }
        cocktail: {
          deps: ['backbone']
        }
        highlighter: {
            deps: ['jquery']
            exports: '$.fn.highlighter'
        }
        iocviewer: {
            deps: ['jquery']
            exports: '$.fn.iocViewer'
        }
        mocha: {
            exports: 'mocha'
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
