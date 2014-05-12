define(function(require) {
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');
    var uac_utils = require('uac/common/utils');

    var SuppressionListItemCollection = require('sf/models/SuppressionListItemCollection');

    var SuppressionsTableView = require('sf/views/SuppressionsTableView');
    var HitsDetailsView = require('sf/views/HitsDetailsView');
    var HitsFacetsView = require('sf/views/HitsFacetsView');

    /**
     * Hits table for a suppression.
     */
    var HitsSuppressionTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            view.hits_collapsable = new CollapsableContentView({
                el: view.el
            });

            options.oLanguage = {
                sEmptyTable: 'The selected suppression is not matching any hits',
                sZeroRecords: 'No matching hits found'
            };

            options['sAjaxSource'] = '/sf/api/hits';
            options.sAjaxDataProp = 'results';
            options['bServerSide'] = true;

            options['aoColumns'] = [
                {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
                {sTitle: "Created", mData: "created", bVisible: true, bSortable: true, sClass: 'nowrap', sWidth: '10%'},
                {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
                {sTitle: "rowitem_type", mData: "rowitem_type", bVisible: false, bSortable: false},
                {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false},
                {sTitle: "Summary", mData: "summary1", bSortable: true, sClass: 'wrap'},
                {sTitle: "Summary2", mData: "summary2", bSortable: true, sClass: 'wrap'},
                {sTitle: "MD5", mData: "md5sum", sClass: 'nowrap', bSortable: true}
            ];

            options.aaSorting = [[1, 'desc']];

            options.aoColumnDefs = [
                view.date_formatter(1)
            ];


            options.sDom = 'ltip';
            view.listenTo(view, 'load', function () {
                view.select_row(0);

                view.hits_collapsable.set('title', _.sprintf('<i class="fa fa-level-down"></i> Suppressed Hits (%s)',
                    view.get_total_rows()));
            });
        }
    });

    var SuppressionsView = View.extend({
        initialize: function (options) {
            var view = this;
            view.options = options;

            if (StrikeFinder.single_entity) {
                view.suppressions = new SuppressionListItemCollection();
            }
            view.suppressions_table = new SuppressionsTableView({
                el: '#suppressions-table',
                collection: view.suppressions
            });
            view.listenTo(view.suppressions_table, 'click', view.render_hits);
            view.listenTo(view.suppressions_table, 'delete', function() {
                if (StrikeFinder.single_entity) {
                    if(view.suppressions){
                        view.suppressions.reset([]);
                    }else{
                        view.suppressions_table.refresh();
                    }
                }
                else {
                    view.block()
                    if(view.suppressions) {
                        view.suppressions.fetch({
                            success: function () {
                                view.suppressions_table.select_row(0);
                                view.unblock();
                            },
                            failure: function () {
                                view.unblock();
                            }
                        });
                    }else{
                        view.listenToOnce(view.suppressions_table, 'draw', function(){
                            view.suppressions_table.select_row(0);
                            view.unblock();
                        });
                        view.suppressions_table.refresh();
                    }
                }
            });
            view.listenTo(view.suppressions_table, 'empty', function () {
                $('.hits-view').fadeOut().hide();
                $('.details-view').fadeOut().hide();
            });

            try {
                view.block();
                if(view.suppressions) {
                    view.suppressions.reset(StrikeFinder.suppressions);
                }
                view.suppressions_table.render();
            }
            finally {
                view.unblock();
            }
        },
        render_hits: function (data) {
            var view = this;

            console.log('Row selected: ' + JSON.stringify(data));

            var suppression_id = data.suppression_id;

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

                // Hits facets.
                view.facets_view = new HitsFacetsView({
                    el: '#hits-facets-div'
                });

                // Listen to criteria changes and reload the views.
                view.listenTo(view.facets_view, 'refresh', function(attributes) {
                    // Reload the hits.
                    view.hits_table_view.fetch(attributes);
                });
            });

            // Specify the host as default criteria.
            view.facets_view.fetch({suppression_id: suppression_id});

            $('.hits-view').fadeIn().show();
        }
    });

    return SuppressionsView
});
