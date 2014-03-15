define(function (require) {
    var async = require('async');
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var Acquisition = require('sf/models/Acquisition');

    var templates = require('sf/ejs/templates');
    var uac_utils = require('uac/common/utils');
    var sf_utils = require('sf/common/utils');

    /**
     * Render the details of an acquisition including the file audit and issues.
     */
    var AcquisitionsDetailsView = View.extend({
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

    var AcquisitionsTableView = TableView.extend({
        initialize: function () {
            var view = this;

            view.acquisitions_collapsable = new CollapsableContentView({
                el: view.el
            });

            // Invoke the super initialize.
            AcquisitionsTableView.__super__.initialize.apply(this);

            if (!view.collection) {
                view.options['sAjaxSource'] = '/sf/api/acquisitions';
                view.options['bServerSide'] = true;
            }
            view.options.sAjaxDataProp = 'results';


            view.options.oLanguage = {
                sEmptyTable: 'No acquisitions were found'
            };

            if (view.options.condensed) {
                // Display in condensed mode.
                view.options['aoColumns'] = [
                    {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: true},
                    {sTitle: "Created", mData: "create_datetime", bSortable: true, sClass: 'nowrap', bVisible: false},
                    {sTitle: "File Path", mData: "file_path", bSortable: true, sClass: 'wrap', sWidth: '65%'},
                    {sTitle: "File Name", mData: "file_name", bSortable: true, sClass: 'wrap', sWidth: '30%'},
                    {sTitle: "State", mData: "state", bSortable: true, sWidth: '5%'}
                ];

                view.options.aaSorting = [
                    [ 1, "desc" ]
                ];

                view.options['aoColumnDefs'] = [
                    {
                        mRender: function (data) {
                            return uac_utils.format_date_string(data);
                        },
                        aTargets: [1]
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
                        aTargets: [3]
                    },
                    {
                        mRender: sf_utils.format_acquisition_state,
                        aTargets: [4]
                    }
                ];

                view.options.iDisplayLength = 10;

                view.options['sDom'] = 'lftip';
            }
            else {
                view.options['aoColumns'] = [
                    {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: true},
                    {sTitle: "Cluster", mData: "cluster.name", bSortable: true},
                    {sTitle: "Host", mData: "agent.hostname", bSortable: true},
                    {sTitle: "File Path", mData: "file_path", bSortable: true, sClass: 'wrap'},
                    {sTitle: "File Name", mData: "file_name", bSortable: true, sClass: 'wrap'},
                    {sTitle: "Created", mData: "create_datetime", bSortable: true, sClass: 'nowrap'},
                    {sTitle: "Updated", mData: "update_datetime", bSortable: true, sClass: 'nowrap'},
                    {sTitle: "User", mData: "user", bSortable: true},
                    {sTitle: "Method", mData: "method", bSortable: true},
                    {sTitle: "State", mData: "state", bSortable: true, sWidth: '75px'},
                    {sTitle: "Error Message", mData: "error_message", bVisible: false, bSortable: false},
                    {sTitle: "Link", mData: "acquired_file", bVisible: false, bSortable: false}
                ];

                view.options.aaSorting = [
                    [ 5, "desc" ]
                ];

                view.options['aoColumnDefs'] = [
                    {
                        mRender: function (data, type, row) {
                            if (data) {
                                return _.sprintf('<a href="/sf/host/%s" onclick="event.stopPropagation()">%s</a>', row.agent.hash, data);
                            }
                            else {
                                return data;
                            }
                        },
                        aTargets: [2]
                    },
                    {
                        mRender: function (data, type, row) {
                            if (row.link) {
                                return _.sprintf('<a href="%s" onclick="event.stopPropagation()" download>%s</a>', row.link, data);
                            }
                            else {
                                return data
                            }
                        },
                        aTargets: [4]
                    },
                    {
                        mRender: function (data, type, row) {
                            return uac_utils.format_date_string(data);
                        },
                        aTargets: [5]
                    },
                    {
                        mRender: function (data, type, row) {
                            return uac_utils.format_date_string(data);
                        },
                        aTargets: [6]
                    },
                    {
                        mRender: sf_utils.format_acquisition_state,
                        aTargets: [9]
                    }
                ];

                view.options.iDisplayLength = 25;
                view.options.iPipe = 1; // Disable pipelining.

                view.options['sDom'] = 'ltip';
            }

            view.listenTo(view, 'row:created', view.on_create_row);
            view.listenTo(view, 'click', view.on_row_click);
            view.listenTo(view, 'load', function () {
                var acquisitions_count = view.get_total_rows();
                view.acquisitions_collapsable.set('title', _.sprintf('<i class="fa fa-cloud-download"></i> Acquisitions (%s)',
                    acquisitions_count));
                if (acquisitions_count == 0) {
                    // Collapse the comments if there are none.
                    view.acquisitions_collapsable.collapse();
                }
                else {
                    view.acquisitions_collapsable.expand();
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
            var view = this;

            if (view.acquisition_details) {
                // Clean up the existing view.
                view.acquisition_details.close();
            }
            view.acquisition_details = new AcquisitionsDetailsView({
                el: '#dialog-div',
                model: new Acquisition(data)
            });
            view.acquisition_details.render();
        }
    });

    return AcquisitionsTableView
});