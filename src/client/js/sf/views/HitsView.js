define(function (require) {
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');
    var uac_utils = require('uac/common/utils');

    var HitsDetailsView = require('sf/views/HitsDetailsView');
    var HitsFacetsView = require('sf/views/HitsFacetsView');

    /**
     * Hits table view.
     */
    var HitsTableView = TableView.extend({
        initialize: function(options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            view.hits_collapsable = new CollapsableContentView({
                el: view.el
            });

            options.sAjaxSource = '/sf/api/hits';
            options.sAjaxDataProp = 'results';
            options.bServerSide = true;

            options.oLanguage = {
                sEmptyTable: 'No hits were found'
            };

            options.aoColumns = [{
                sTitle: 'uuid',
                mData: 'uuid',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'Created',
                mData: 'created',
                bVisible: true,
                bSortable: true,
                sClass: 'nowrap'
            }, {
                sTitle: 'am_cert_hash',
                mData: 'am_cert_hash',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'rowitem_type',
                mData: 'rowitem_type',
                bVisible: false,
                bSortable: false
            }, {
                sTitle: 'Tag',
                mData: 'tagname',
                bSortable: true
            }, {
                sTitle: 'Summary',
                mData: 'summary1',
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: 'Summary2',
                mData: 'summary2',
                bSortable: true,
                sClass: 'wrap'
            }, {
                sTitle: "MD5",
                mData: "md5sum",
                bSortable: true,
                sClass: 'nowrap'
            }];

            options.aaSorting = [
                [1, 'desc']
            ];

            options.aoColumnDefs = [
                view.date_formatter(1)
            ];

            view.listenTo(view, 'load', function() {
                // Create the CSV link in the table header.

                // The url for the link.
                var url = '/sf/api/hits?format=csv';
                if (view.params) {
                    url += '&' + $.param(view.params);
                }
                // The download file for the link.
                var file = 'hits-' + moment().format('YYYY-MM-DD-HH:mm:ss') + '.csv';
                // The link.
                var html = _.sprintf('<div class="pull-right" style="margin-bottom: 10px"><a download="%s" href="%s">Export to CSV</a></div>', file, url);
                // Add the link the table header.
                view.$el.parent().find('.uac-tableheader').append(html);


                // Select the first row.
                view.select_row(0);
            });
            view.listenTo(view, 'click', function(row, ev) {
                var position = view.get_absolute_index(ev.currentTarget);

                var title;
                if (position !== undefined) {
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, view.get_total_rows());
                } else {
                    title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', view.get_total_rows());
                }
                // Update the title with the count of the rows.
                view.hits_collapsable.set('title', title);
            });
            view.listenTo(view, 'empty', function() {
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', '0');
                view.hits_collapsable.set('title', title);
            });

            //options.sDom = 'lTtip';
            // Add the tableheader div to the table.
            options.sDom = '<"uac-tableheader"l>tip';
            options.iDisplayLength = 10;
        }
    });

    /**
     * View for the hits screen.
     */
    var HitsView = View.extend({
        initialize: function(options) {
            var view = this;

            view.params = {};

            // Hits.
            view.hits_table_view = new HitsTableView({
                el: '#hits-table'
            });

            // Initialize the hits details view.
            view.hits_details_view = new HitsDetailsView({
                el: '#hits-details-div',
                hits_table_view: view.hits_table_view
            });
            view.listenTo(view.hits_details_view, 'create:tag', function(rowitem_uuid, tagname) {
                // A new tag has been created, loop through the table nodes and manually update the tagname
                // for the relevant row.  This is a shortcut rather than re-loading the entire table.
                view.hits_table_view.update_row('uuid', rowitem_uuid, 'tagname', tagname, 1);
            });
            view.listenTo(view.hits_details_view, 'create:acquire', function(row) {
                // An acquisition has been created, update the row's tag value.
                view.hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1);
                // Refresh the comments.
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
        },
        fetch: function(params) {
            var view = this;

            console.log(_.sprintf('Rendering hits view with params: %s', JSON.stringify(params)));

            // Update the recent list.
            if (params.exp_key) {
                uac_utils.recent({
                    name: 'Hit Review: ' + params.exp_key,
                    type: 'checkout',
                    values: params
                });
            } else if (params.iocnamehash) {
                uac_utils.recent({
                    name: 'Hit Review: ' + params.iocnamehash,
                    type: 'checkout',
                    values: params
                });
            } else if (params.ioc_uuid) {
                uac_utils.recent({
                    name: 'Hit Review: ' + params.ioc_uuid,
                    type: 'checkout',
                    values: params
                });
            }

            if (params.exp_key) {
                // Use this value when available to select the corresponding IOC tab.
                view.hits_details_view.default_exp_key = params.exp_key;
            }

            // Identity rollup is the default for the hits view.
            params.identity_rollup = true;

            // Render the hits.
            view.facets_view.fetch(params);


            //}
        }
    });

    return HitsView;
});