define(function (require) {
    var View = require('uac/views/View');

    SuppressionsAppView = View.extend({
        initialize: function () {
            var view = this;

            view.suppressions = new StrikeFinder.SuppressionListItemCollection();
            view.suppressions_table = new StrikeFinder.SuppressionsTableView({
                el: '#suppressions-table',
                collection: view.suppressions
            });
            view.listenTo(view.suppressions_table, 'click', view.render_hits);
            view.listenTo(view.suppressions_table, 'delete', function () {
                if (StrikeFinder.single_entity) {
                    view.suppressions.reset([]);
                }
                else {
                    UAC.block();
                    view.suppressions.fetch({
                        success: function () {
                            view.suppressions_table.select_row(0);
                            UAC.unblock();
                        },
                        failure: function () {
                            UAC.unblock();
                        }
                    });
                }
            });
            view.listenTo(view.suppressions_table, 'empty', function () {
                $('.hits-view').fadeOut().hide();
                $('.details-view').fadeOut().hide();
            });

            view.suppressions.reset(StrikeFinder.suppressions);
        },
        render_hits: function (data) {
            var view = this;

            log.debug('Row selected: ' + JSON.stringify(data));

            var suppression_id = data.suppression_id;

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

                // Hits facets.
                view.facets_view = new StrikeFinder.HitsFacetsView({
                    el: '#hits-facets-div'
                });

                // Listen to criteria changes and reload the views.
                view.listenTo(view.facets_view, 'refresh', function (attributes) {
                    // Reload the hits.
                    view.hits_table_view.fetch(attributes);
                });
            });

            // Specify the host as default criteria.
            view.facets_view.fetch({suppression_id: suppression_id});

            $('.hits-view').fadeIn().show();
        }
    });

    return SuppressionsAppView;
});