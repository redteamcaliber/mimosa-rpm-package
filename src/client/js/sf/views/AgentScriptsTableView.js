define(function (require) {
    var async = require('async');
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var Acquisition = require('sf/models/Acquisition');
    var AcquisitionAuditModel = require('sf/models/AcquisitionAuditModel');

    var templates = require('sf/ejs/templates');
    var uac_utils = require('uac/common/utils');
    var sf_utils = require('sf/common/utils');
    var Marionette = require('marionette');

    /**
     * Render the details of an acquisition including the file audit and issues.
     */
    var AcquisitionsDetailsView = View.extend({
        initialize: function(options) {
            this.options = options;
        },
        events: {
            'click #close': 'on_close'
        },
        render: function() {
            var view = this;

            async.waterfall([
                function(callback) {
                    // Retrieve the file audit if there is a link defined.
                    if (view.model.get('link')) {
                        var audit = new AcquisitionAuditModel({
                            id: view.model.get('uuid')
                        });
                        audit.fetch({
                            success: function(model) {
                                // Ok.
                                callback(null, model.get('content'));
                            },
                            error: function(model, response) {
                                // Error.
                                if (response.status == 404) {
                                    // No audit found.
                                    callback(null, null);
                                }
                                else {
                                    var response_text = response && response.responseText ? response.responseText : 'NA';
                                    callback('Error while retrieving file audit: ' + response_text);
                                }
                            }
                        });
                    }
                    else {
                        // There was not a link.
                        callback(null, undefined);
                    }
                },
                function(audit) {
                    // Render the details template.
                    var context = view.model.toJSON();
                    context.is_link = context.link ? true : false;
                    context.is_error = context.error_message ? true : false;
                    context.format_state = sf_utils.format_acquisition_state;
                    context.format_level = sf_utils.format_acquisition_level;
                    context.is_audit = audit ? true : false;
                    context.audit = audit;

                    view.apply_template(templates, 'acquisition-details.ejs', context);

                    view.collapse(view.el);

                    view.$('#acquisition-details-div').modal({
                        backdrop: false
                    });
                }
            ]);
        },
        close: function () {
            this.stopListening();
        }
    });

    var AgentScriptsDatasetChooser = Marionette.ItemView.extend({

    });

    var AgentScriptsTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            view.scripts_collapsable = new CollapsableContentView({
                el: view.el
            });

            if (!view.collection) {
                options['sAjaxSource'] = '/sf/api/task_result';
                options['bProcessing'] = false;
//                options['bServerSide'] = false;
            }
            options.sAjaxDataProp = 'results';


            options.oLanguage = {
                sEmptyTable: 'No scripts were found'
            };

            // Display in condensed mode.
            if (options.condensed) {

                options.aaSorting = [
                    [ 1, "desc" ]
                ];

                options['aoColumnDefs'] = [


                    {
                        mRender: sf_utils.format_acquisition_state,
                        aTargets: [0]
                    },
                    {
                        mRender: function (data, type, row) {
                            if (row.link) {
                                return _.sprintf('<a href="%s" onclick="event.stopPropagation()">%s</a>',
                                    row.link, row.file_name);
                            }
                            else {
                                return data;
                            }
                        },
                        aTargets: [2]
                    },
                    {
                        mRender: function (data) {
                            return uac_utils.format_date_string(data);
                        },
                        aTargets: [4]
                    }
                ];

                options.iDisplayLength = 10;

                options['sDom'] = 'lftip';


                options['aoColumns'] = [
                    {sTitle: "State", mData: "state", bSortable: true, sWidth: '75px'},
                    {sTitle: "Type", mData: "type", bSortable: true, sWidth: '75px'},
                    {sTitle: "Job Name", mData: "jobName", bSortable: true, sWidth: '75px'},
                    {sTitle: "Created By", mData: "user", bSortable: true, sWidth: '75px'},
                    {sTitle: "Updated On", mData: "updatedDate", bSortable: true, sWidth: '75px'}
                ];
            }
            else {
                options['aoColumns'] = [
                    {sTitle: "State", mData: "state", bSortable: true, sWidth: '75px'},
                    {sTitle: "Type", mData: "type", bSortable: true, sWidth: '75px'},
                    {sTitle: "Job Name", mData: "jobName", bSortable: true, sWidth: '75px'},
                    {sTitle: "Client", mData: "clientName", bSortable: true, sWidth: '75px'},
                    {sTitle: "Host Name", mData: "hostName", bSortable: true, sWidth: '75px'},
                    {sTitle: "Created By", mData: "user", bSortable: true, sWidth: '75px'},
                    {sTitle: "Updated On", mData: "updatedDate", bSortable: true, sWidth: '75px'},
                ];

                options.aaSorting = [
                    [ 5, "desc" ]
                ];

                options['aoColumnDefs'] = [
                    {
                        mRender: sf_utils.format_acquisition_state,
                        aTargets: [0]
                    },
                    {

                        mRender: function (data, type, row) {
                            if (data && row.type === 'acquisition' || row.type == 'triage') {
                                return _.sprintf('<a href="/sf/host/%s" onclick="event.stopPropagation()">%s</a>', row.raw.agent.hash, data);
                            }
                            else {
                                return data;
                            }
                        },
                        aTargets: [4]
                    },
                    {
                        mRender: function (data, type, row) {
                            if (row.link) {
                                return _.sprintf('<a href="%s" onclick="event.stopPropagation()" download>%s</a>', row.link, row.jobName, data);
                            }
                            else {
                                return data
                            }
                        },
                        aTargets: [2]
                    },
                    {
                        mRender: function (data, type, row) {
                            return uac_utils.format_date_string(data);
                        },
                        aTargets: [6]
                    }
                ];

                options.iDisplayLength = 25;
//                options.iPipe = 1; // Disable pipelining.

                options['sDom'] = 'ltip';
            }

            view.listenTo(view, 'row:created', view.on_create_row);
            view.listenTo(view, 'click', view.on_row_click);
            view.listenTo(view, 'load', function () {
                var scripts_count = view.get_total_rows();
                view.scripts_collapsable.set('title', _.sprintf('<i class="fa fa-cloud-download"></i> Scripts (%s)',
                    scripts_count));
                if (scripts_count == 0) {
                    // Collapse the comments if there are none.
                    view.scripts_collapsable.collapse();
                }
                else {
                    view.scripts_collapsable.expand();
                }
            });
        },
        on_create_row: function (row, data, index) {
            // Display a toolip if there is an error message.
            if (data.error_message) {
                $(row).find('.error_message').tooltip({
                    title: data.error_message,
                    trigger: 'hover',
                    placement: 'left'
                });
            }
        },
        on_row_click: function (data) {
            if (data.type === 'acquisition') {
                var view = this;

                if (view.acquisition_details) {
                    // Clean up the existing view.
                    view.acquisition_details.close();
                }
                view.acquisition_details = new AcquisitionsDetailsView({
                    el: '#dialog-div',
                    model: new Acquisition(data.raw)
                });
                view.acquisition_details.render();
            }
        }
    });

    return AgentScriptsTableView
});