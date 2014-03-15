define(function (require) {
    var View = require('uac/views/View');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var AcquisitionAuditModel = require('sf/models/AcquisitionAuditModel');

    var ClusterSelectionView = require('sf/views/ClusterSelectionView');
    var AcquisitionsTableView = require('sf/views/AcquisitionsTableView');
    var HitsDetailsView = require('sf/views/HitsDetailsView');

    var templates = require('sf/ejs/templates');


    var AcquisitionsView = View.extend({
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
        }
    });

    return AcquisitionsView;
});