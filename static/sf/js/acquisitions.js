var StrikeFinder = StrikeFinder || {};

StrikeFinder.AcquisitionsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;
        view.acquisitions_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '',
        });

        view.options['sAjaxSource'] = '/sf/api/acquisitions';
        view.options.sAjaxDataProp = 'results';
        view.options['bServerSide'] = true;

        view.options.oLanguage = {
            sEmptyTable: 'No acquisitions were found'
        };

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
                        return _.sprintf('<a href="/sf/host/%s">%s</a>', row.agent.hash, data);
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
                        return _.sprintf('<a href="%s">%s</a>', row.link, data);
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
                mRender: function (data, type, row) {
                    if (data) {
                        var label_class = '';
                        if (data == 'errored') {
                            label_class = 'label-danger';
                        }
                        else if (data == 'cancelled') {
                            label_class = 'label-warning';
                        }
                        else if (data == 'submitted') {
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
                },
                aTargets: [9]
            }
        ];

        view.options.iDisplayLength = 50;

        view.options['sDom'] = 'ltip';

        view.listenTo(view, 'row:created', view.on_create_row);
        view.listenTo(view, 'click', view.on_row_click);
        view.listenTo(view, 'load', function () {
            view.acquisitions_collapsable.set('title', _.sprintf('<i class="fa fa-cloud-download"></i> Acquisitions (%s)',
                view.get_total_rows()));
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
        if (data.link) {
            if (view.audit_dialog) {
                view.audit_dialog.close();
            }
            view.audit_dialog = new StrikeFinder.AcquisitionsAuditView({
                el: '#dialog-div',
                acquisition_uuid: data.uuid
            });
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
        view.$el.html(_.template($("#acquisition-audit-template").html(), view.model.toJSON()));

        StrikeFinder.collapse(this.el);

        view.$('#acqusition-audit-div').modal({
            backdrop: false
        });
    },
    on_close: function() {
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
            el: '#criteria-div',
            title: '<i class="fa fa-search"></i> Acquisitions Search Criteria'
        });

        // Clusters options.
        view.clusters = new StrikeFinder.ClustersCollection();
        view.clusters_view = new StrikeFinder.SelectView({
            el: '#clusters-select',
            collection: view.clusters,
            id_field: "cluster_uuid",
            value_field: "cluster_name",
            selected: StrikeFinder.usersettings.clusters,
            width: "100%",
            placeholder: 'Select Clusters'
        });
        view.clusters_view.on('change', function (clusters) {
            // Update the model criteria when values change.
            view.clusters = clusters;
            if (view.clusters && view.clusters.length > 0) {
                view.acquisitions_table.fetch({clusters: view.clusters});
                $('#results-div').fadeIn().show();
            }
            else {
                $('#results-div').fadeOut().hide();
            }
        });

        view.acquisitions_table = new StrikeFinder.AcquisitionsTableView({
            el: '#acquisitions-table'
        });

        view.clusters.reset(StrikeFinder.clusters);
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
