define(function (require) {
    var View = require('uac/views/View');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var AcquisitionAuditModel = require('sf/models/AcquisitionAuditModel');

    var ClusterSelectionView = require('sf/views/ClusterSelectionView');
    var AgentTasksTableView = require('sf/views/AgentTasksTableView');
    var HitsDetailsView = require('sf/views/HitsDetailsView');

    var templates = require('sf/ejs/templates');

    var moment = require('moment');

    var vent = require('uac/common/vent');
    var reqres = require('uac/common/reqres');
    vent.on('all', function(event_name) {
        console.debug("Event: "+event_name);
    });


    var AgentTasksView = View.extend({
        initialize: function () {

            var view = this;

            view.criteria_collapsable = new CollapsableContentView({
                el: '#collapsable-div',
                title: '<i class="fa fa-search"></i> Agent Tasks Search Criteria'
            });

            // Create the cluster selection component.
            view.cluster_selection_view = new ClusterSelectionView({
                el: '#cluster-selection-div',
                hide_services: true
            });
            view.listenTo(view.cluster_selection_view, 'submit', function (params) {
                view.render_tasks({
                    clusters: params.merged_clusters,
                    startDate: params.startDate,
                    endDate: params.endDate
                });
            });
            view.listenTo(view.cluster_selection_view, 'clear', function () {
                $('#results-div').fadeOut().hide();
            });
            view.cluster_selection_view.render();

            view.tasks_table = new AgentTasksTableView({
                el: '#acquisitions-table'
            });

            // Display the initial selection of tasks.
            view.render_tasks({
                clusters: view.cluster_selection_view.get_clusters(),
                startDate: view.cluster_selection_view.get_start_date(),
                endDate: view.cluster_selection_view.get_end_date()
            });
        },
        render_tasks: function (params) {
            var view = this;

            // Update the model criteria when values change.
            view.clusters = params.clusters;
            view.startDate = params.startDate;
            view.endDate = params.endDate;
            if (view.clusters && view.clusters.length > 0) {
                view.tasks_table.fetch({
                    clusters: view.clusters,
                    update_datetime__gte: moment(view.startDate*1000).format("YYYY-MM-DD"),
                    update_datetime__lte: moment(view.endDate*1000).format("YYYY-MM-DD"),
                    limit: 2000
                });
                $('#results-div').fadeIn().show();
            }
            else {
                $('#results-div').fadeOut().hide();
            }
        }
    });

    return AgentTasksView;
});