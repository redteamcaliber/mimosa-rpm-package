var NT = NT || {};

NT.Alert = UAC.Model.extend({

});

NT.AlertCollection = UAC.Collection.extend({
    model: NT.Alert
});

NT.AlertsTableView = new StrikeFinder.TableView.extend({
    initialize: function() {
        var view = this;

        // Invoke the super initialize function.
        Backbone.View.prototype.initialize.call(view);

        view.collection = new AlertsCollection();
        view.options['iDisplayLength'] = -1;

        view.options['sDom'] = 't';

        view.options['aoColumns'] = [
            {sTitle: "Suppression Id", mData: 'suppression_id', bVisible: false, bSortable: false},
            {sTitle: "Suppression", mData: 'comment', bVisible: true, bSortable: false, sClass: 'wrap'},
            {sTitle: "Global", mData: 'cluster_name', bVisible: true, bSortable: false},
            {sTitle: "Hits", mData: 'suppressed', bVisible: true, bSortable: false},
            {sTitle: "Created", mData: 'created', bSortable: true, sClass: 'nowrap', visible: false}
        ];
    }
});

NT.AlertsView = new UAC.View.extend({
    initialize: function() {
        var view = this;

        var alerts = new NT.AlertsCollection();

        view.alerts_table = new NT.AlertsTable({
            el: '#alerts-div',
            collection: alerts
        });

        alerts.reset([
            {
                priority: 1,
                count: 3,
                client_count: 5,
                signatures: 1,
                hits: 32304
            },
            {
                priority: 2,
                count: 6,
                client_count: 2,
                signatures: 2,
                hits: 22222
            },
            {
                priority: 3,
                count: 6,
                client_count: 1,
                signatures: 78,
                hits: 11111
            },
            {
                priority: 4,
                count: 34,
                client_count: 17,
                signatures: 43,
                hits: 2345
            }
        ]);
    }
});
