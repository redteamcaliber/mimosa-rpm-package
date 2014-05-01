define(function (require) {
    var View = require('uac/views/View');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var AcquisitionAuditModel = require('sf/models/AcquisitionAuditModel');

    var ClusterSelectionView = require('sf/views/ClusterSelectionView');
    var AgentScriptsTableView = require('sf/views/AgentScriptsTableView');
    var HitsDetailsView = require('sf/views/HitsDetailsView');

    var templates = require('sf/ejs/templates');

    var moment = require('moment');



    var AgentScriptsView = View.extend({
        initialize: function () {

            var view = this;

            view.criteria_collapsable = new CollapsableContentView({
                el: '#collapsable-div',
                title: '<i class="fa fa-search"></i> Agent Scripts Search Criteria'
            });

            // Create the cluster selection component.
            view.cluster_selection_view = new ClusterSelectionView({
                el: '#cluster-selection-div',
                hide_services: true
            });
            view.listenTo(view.cluster_selection_view, 'submit', function (params) {
                view.render_scripts({
                    clusters: params.merged_clusters,
                    startDate: params.startDate,
                    endDate: params.endDate
                });
            });
            view.listenTo(view.cluster_selection_view, 'clear', function () {
                $('#results-div').fadeOut().hide();
            });
            view.cluster_selection_view.render();

            view.scripts_table = new AgentScriptsTableView({
                el: '#acquisitions-table'
            });

            // Display the initial selection of scripts.
            view.render_scripts({clusters: view.cluster_selection_view.get_clusters()});
        },
        render_scripts: function (params) {
            var view = this;

            // Update the model criteria when values change.
            view.clusters = params.clusters;
            view.startDate = params.startDate;
            view.endDate = params.endDate;
            if (view.clusters && view.clusters.length > 0) {
                view.scripts_table.fetch({
                    clusters: view.clusters,
                    update_datetime__gte: moment(view.startDate*1000).format("YYYY-MM-DD"),
                    update_datetime__lte: moment(view.endDate*1000).format("YYYY-MM-DD")
                });
                $('#results-div').fadeIn().show();
            }
            else {
                $('#results-div').fadeOut().hide();
            }
        }
    });

    return AgentScriptsView;
});