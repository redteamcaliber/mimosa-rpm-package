define(function (require) {
    var View = require('uac/views/View');
    var CollapsableContentView = require('uac/views/CollapsableContentView');
    var ClusterSelectionView = require('sf/views/ClusterSelectionView');
    var AcquisitionsTableView = require('sf/views/AcquisitionsTableView');
    var HitsSuppressionTableView = require('sf/views/HitsSuppressionTableView');
    var HitsDetailsView = require('sf/views/HitsDetailsView');

    AcquisitionsView = View.extend({
        initialize: function () {
            var view = this;

            view.criteria_collapsable = new CollapsableContentView({
                el: '#collapsable-div',
                title: '<i class="fa fa-search"></i> Acquisitions Search Criteria'
            });

            // Create the cluster selection component.
            view.cluster_selection_view = new ClusterSelectionView({
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

            view.acquisitions_table = new AcquisitionsTableView({
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

            console.log('Row selected: ' + JSON.stringify(data));

            var suppression_id = data['suppression_id'];

            view.run_once('init_hits', function () {
                view.hits_table_view = new HitsSuppressionTableView({
                    el: '#hits-table'
                });

                view.hits_details_view = new HitsDetailsView({
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

    return AcquisitionsView;
});