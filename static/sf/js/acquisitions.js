var StrikeFinder = StrikeFinder || {};


StrikeFinder.AcquisitionsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.acquisitions_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el
        });

        // Invoke the super initialize.
        StrikeFinder.AcquisitionsTableView.__super__.initialize.apply(this);

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
                        return StrikeFinder.format_date_string(data);
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
                    mRender: view.format_state,
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
                        return StrikeFinder.format_date_string(data);
                    },
                    aTargets: [5]
                },
                {
                    mRender: function (data, type, row) {
                        return StrikeFinder.format_date_string(data);
                    },
                    aTargets: [6]
                },
                {
                    mRender: view.format_state,
                    aTargets: [9]
                }
            ];

            view.options.iDisplayLength = 25;

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

        //console.dir(data);

        if (data.link) {
            if (view.audit_dialog) {
                view.audit_dialog.close();
            }
            view.audit_dialog = new StrikeFinder.AcquisitionsAuditView({
                el: '#dialog-div',
                acquisition_uuid: data.uuid
            });
        }
    },
    format_state: function (data, type, row) {
        if (data) {
            var label_class = '';
            if (data == 'errored') {
                label_class = 'label-danger';
            }
            else if (data == 'cancelled') {
                label_class = 'label-warning';
            }
            else if (data == 'created') {
                label_class = 'label-default';
            }
            else if (data == 'started' || data == 'created') {
                label_class = 'label-primary';
            }
            else if (data == 'completed') {
                label_class = 'label-success';
            }
            else if (data == 'unknown') {
                label_class = 'label-warning';
            }
            else {
                label_class = 'label-default';
            }
            return _.sprintf('<span class="label %s error_message" style="text-align: center; width: 100%%">%s</span>', label_class, data);
        }
        else {
            return '';
        }
    }
});

StrikeFinder.AcquisitionsAuditView = StrikeFinder.View.extend({
    events: {
        'click #close': 'on_close'
    },
    initialize: function () {
        var view = this;
        view.model = new StrikeFinder.AcquisitionAuditModel({
            id: view.options.acquisition_uuid
        });
        view.listenTo(view.model, 'sync', view.render);
        view.model.fetch();
    },
    render: function () {
        var view = this;

        view.apply_template('acquisition-audit.html', view.model.toJSON());

        StrikeFinder.collapse(this.el);

        view.$('#acqusition-audit-div').modal({
            backdrop: false
        });
    },
    on_close: function () {
        this.$("#acqusition-audit-div").modal("hide");
    },
    close: function () {
        this.stopListening();
    }
});

StrikeFinder.AcquisitionsView = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;

        view.criteria_collapsable = new StrikeFinder.CollapsableContentView({
            el: '#collapsable-div',
            title: '<i class="fa fa-search"></i> Acquisitions Search Criteria'
        });

        // Create the cluster selection component.
        view.cluster_selection_view = new StrikeFinder.ClusterSelectionView({
            el: '#cluster-selection-div',
            hide_services: true
        });
        view.listenTo(view.cluster_selection_view, 'submit', function (params) {
            view.render_acquisitions({clusters: params.merged_clusters});
        });
        view.listenTo(view.cluster_selection_view, 'clear', function () {
            $('#results-div').fadeOut().hide();
        });
        view.cluster_selection_view.render();

        view.acquisitions_table = new StrikeFinder.AcquisitionsTableView({
            el: '#acquisitions-table'
        });

        // Display the initial selection of acquisitions.
        view.render_acquisitions({clusters: view.cluster_selection_view.get_clusters()});
    },
    render_acquisitions: function (params) {
        var view = this;

        // TODO: Should load the facets here!

        // Update the model criteria when values change.
        view.clusters = params.clusters;
        if (view.clusters && view.clusters.length > 0) {
            view.acquisitions_table.fetch({clusters: view.clusters});
            $('#results-div').fadeIn().show();
        }
        else {
            $('#results-div').fadeOut().hide();
        }
    },
    do_render_hits: function (data) {
        var view = this;

        log.debug('Row selected: ' + JSON.stringify(data));

        var suppression_id = data['suppression_id'];

        view.run_once('init_hits', function () {
            view.hits_table_view = new StrikeFinder.HitsSuppressionTableView({
                el: '#hits-table'
            });

            view.hits_details_view = new StrikeFinder.HitsDetailsView({
                el: '#hits-details-view',
                hits_table_view: view.hits_table_view,
                tag: false,
                suppress: false,
                masstag: false
            });
        });

        view.hits_table_view.fetch(suppression_id);

        $('.hits-view').fadeIn().show();
    },
    render_hits: function (data) {
        var view = this;
        view.do_render_hits(data);
    }
});

/**
 * View to display acquisitions in a condensed format.
 */
StrikeFinder.AcquisitionsViewCondensed = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;

//        view.criteria_collapsable = new StrikeFinder.CollapsableContentView({
//            el: view.el,
//            title: '<i class="fa fa-cloud-download"></i> Acquisitions'
//        });

        view.acquisitions = new StrikeFinder.AcquisitionCollection();

        view.acqusitions_table = new StrikeFinder.AcquisitionsTableView({
            el: view.el,
            collection: view.acquisitions,
            condensed: true
        });
    },
    fetch: function (identity) {
        if (!identity) {
            // Error
            log.error('Condensed acquisitions view requires an identity!');
        }

        var view = this;
        view.acquisitions.identity = identity;
        view.acquisitions.fetch();
    }
});
