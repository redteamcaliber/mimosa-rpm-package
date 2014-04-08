var NT = NT || {};

NT.Alert = UAC.Model.extend({

});

NT.AlertsCollection = UAC.Collection.extend({
    model: NT.Alert
});

NT.AlertsTableView = StrikeFinder.TableView.extend({
    initialize: function(options) {
        // Invoke the super initialize function.
        view.constructor.__super__.initialize.apply(this, arguments);

        var view = this;
        view.options['iDisplayLength'] = -1;

        view.options['sDom'] = 't';

        view.options['aoColumns'] = [
            {sTitle: '', mData: 'id', bVisible: true, bSortable: false, sWidth: '1%'},
            {sTitle: "Priority", mData: 'priority', bVisible: true, bSortable: true},
            {sTitle: "Alerts", mData: 'alerts', bVisible: true, bSortable: true},
            {sTitle: "Clients", mData: 'clients', bVisible: true, bSortable: true},
            {sTitle: "Signatures", mData: 'signatures', bVisible: true, bSortable: true},
            {sTitle: "Hits", mData: 'hits', bVisible: true, bSortable: true}
        ];

        view.options['aoColumnDefs'] = [
            {
                mRender: function (data, type, row) {
                    return '<i class="fa fa-plus-circle text-default expand"></i>'
                },
                aTargets: [0]
            },
            {
                mRender: function (data, type, row) {
                    if (data == 1) {
                        return '<label class="label label-danger">1 - High</label>';
                    }
                    else if (data == 2) {
                        return '<label class="label label-warning">2 - Elevated</label>';
                    }
                    else if (data == 3) {
                        return '<label class="label label-success">3 - Medium</label>';
                    }
                    else if (data == 4) {
                        return '<label class="label label-primary">4 - Low</label>';
                    }
                    else {
                        return '<label class="label label-default">Unknown</label>';
                    }
                },
                aTargets: [1]
            }
        ];

        view.options.aaSorting = [
            [1, 'asc']
        ];

        view.options.oLanguage = {
            sEmptyTable: 'No alerts were found',
            sZeroRecords: 'No matching alerts found'
        };

        view.listenTo(view, 'expand', function(tr) {
            view.expand__collapse_row(tr, function(data) {
                return 'This is a test!';
            });
        });
    }
});

NT.AlertsView = UAC.View.extend({
    initialize: function() {
        var view = this;

        var alerts = new NT.AlertsCollection();

        view.alerts_table = new NT.AlertsTableView({
            el: '#alerts-table',
            collection: alerts
        });

        alerts.reset([
            {
                id: 1,
                priority: 1,
                alerts: 3,
                clients: 5,
                unique_signatures: 1,
                hits: 32304
            },
            {
                id: 2,
                priority: 2,
                alerts: 6,
                clients: 2,
                unique_signatures: 2,
                hits: 22222
            },
            {
                id: 3,
                priority: 3,
                alerts: 6,
                clients: 1,
                unique_signatures: 78,
                hits: 11111
            },
            {
                id: 4,
                priority: 4,
                alerts: 34,
                clients: 17,
                unique_signatures: 43,
                hits: 2345
            }
        ]);
        view.alerts_table.render();
    }
});
