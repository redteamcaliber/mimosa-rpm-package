
define(function(require) {
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');

    var AgentHostModel = require('sf/models/AgentHostModel');

    var HitsDetailsView = require('sf/views/HitsDetailsView');
    var HitsFacetsView = require('sf/views/HitsFacetsView');

    var templates = require('sf/ejs/templates');

    var AgentTasksTableView = require('sf/views/AgentTasksTableView');

    /**
     * Hits table view for display on the host view.
     * @type {*}
     */
    var HostHitsTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            view.collapsable = new CollapsableContentView({
                el: view.el,
                title: '<i class="fa fa-list"></i> Hits'
            });

            options['aoColumns'] = [
                {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
                {sTitle: "Created", mData: "created", bVisible: true, bSortable: true, sClass: 'nowrap'},
                {sTitle: "Tag", mData: "tagname", bVisible: true, bSortable: true},
                {sTitle: "Summary", mData: "summary1", sClass: 'wrap', bSortable: true},
                {sTitle: "Summary2", mData: "summary2", sClass: 'wrap', bSortable: true},
                {sTitle: "MD5", mData: "md5sum", sClass: 'nowrap', bSortable: true},
                {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false}
            ];

            options['aaSorting'] = [[1, 'desc']];

            options.aoColumnDefs = [
                view.date_formatter(1)
            ];

            options.sDom = '<"uac-tableheader"l>tip';

            options.sAjaxSource = '/sf/api/hits';
            options.sAjaxDataProp = 'results';
            options.bServerSide = true;

            options.oLanguage = {
                sEmptyTable: 'This host does not have any hits.',
                sZeroRecords: 'No matching hits found'
            };

            view.listenTo(view, 'load', function () {
                // Create the CSV link in the table header.

                // The url for the link.
                var url = '/sf/api/hits?format=csv';
                if (view.params) {
                    url += '&' + $.param(view.params);
                }
                // The download file for the link.
                var file = 'hits-' + view.params.am_cert_hash + '.csv';
                // The link.
                var html = _.sprintf('<div class="pull-right" style="margin-bottom: 10px"><a download="%s" href="%s">Export to CSV</a></div>', file, url);
                // Add the link the table header.
                view.$el.parent().find('.uac-tableheader').append(html);


                // Load the first hit on load of the view.
                view.select_row(0);
            });

            view.listenTo(view, 'click', function (row, ev) {
                var position = view.get_absolute_index(ev.currentTarget);

                var title;
                if (position !== undefined) {
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, view.get_total_rows());
                }
                else {
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', view.get_total_rows());
                }
                // Update the title with the count of the rows.
                view.collapsable.set('title', title);
            });
        }
    });

    /**
     * StrikeFinder view class for displaying a hosts extended details.
     */
    var HostHeaderView = View.extend({
        initialize: function (options) {
            var view = this;

            if (!view.model) {
                var am_cert_hash = options['am_cert_hash'];
                if (!view.model) {
                    var attr = {};
                    if (options && options.am_cert_hash) {
                        attr.hash = options.am_cert_hash;
                    }
                    view.model = new AgentHostModel(attr);
                }
                view.listenTo(this.model, 'sync', this.render);
            }

            view.collapsable = new CollapsableContentView({
                el: view.el
            });
        },
        render: function () {
            var view = this;

            var data = this.model.toJSON();

            // Update the collapsable title.
            var title = _.sprintf('%s (%s) : %s / %s',
                data.cluster.engagement.client.name, data.cluster.name, data.domain, data.hostname);
            view.collapsable.set('title', '<i class="fa fa-desktop"></i> ' + title);
            // Render the template.
            view.apply_template(templates, 'host.ejs', data);
        },
        fetch: function (am_cert_hash) {
            if (am_cert_hash) {
                this.model.id = am_cert_hash;
            }
            this.model.fetch();
        }
    });


    var HostView = View.extend({
        initialize: function(options) {
            var view = this;

            view.model = new AgentHostModel(StrikeFinder.host);

            // The hosts view.
            view.hosts_view = new HostHeaderView({
                el: '#host-div',
                model: view.model
            });
            view.hosts_view.render();

            // The tasks view.
            view.agent_tasks_table_view = new AgentTasksTableView({
               el: '#agent-tasks-div'
            });

            // The hits view.
            view.hits_table_view = new HostHitsTableView({
                el: '#hits-table'
            });

            // The hits details.
            view.hits_details_view = new HitsDetailsView({
                el: '#hits-details',
                hits_table_view: view.hits_table_view
            });
            view.listenTo(view.hits_details_view, 'create:acquire', function(row) {
                // An acquisition has been created, update the row's tag value.
                view.hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1);
                // Refresh the comments.
                view.hits_details_view.fetch();
            });
            view.listenTo(view.hits_details_view, 'create:tag', function(row, tagname) {
                view.hits_table_view.update_row('uuid', row.uuid, 'tagname', tagname, 0);
                view.hits_details_view.fetch();
            });
            view.listenTo(view.hits_details_view, 'create:suppression', function() {
                // Reload the facets after a suppression is created.
                view.facets_view.fetch();
            });
            view.listenTo(view.hits_details_view, 'create:masstag', function() {
                // Reload the facets after a suppression is created.
                view.facets_view.fetch();
            });

            // Hits facets.
            view.facets_view = new HitsFacetsView({
                el: '#hits-facets-div'
            });

            // Listen to criteria changes and reload the views.
            view.listenTo(view.facets_view, 'refresh', function(attributes) {
                // Reload the hits.
                view.hits_table_view.fetch(attributes);
            });

            view.facets_view.fetch({
                identity_rollup: true,
                am_cert_hash: view.model.get('hash')
            });

            view.agent_tasks_table_view.fetch({
                agent__uuid: StrikeFinder.host.uuid
            });
        }
    });

    return HostView;
});