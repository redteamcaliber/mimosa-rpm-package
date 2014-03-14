define(function (require) {
    var View = require('uac/views/View');
    var uac_utils = require('uac/common/utils');

    var HitsTableView = require('sf/views/HitsTableView');
    var HitsDetailsView = require('sf/views/HitsDetailsView');
    var HitsFacetsView = require('sf/views/HitsFacetsView');

    /**
     * View for the hits screen.
     */
    HitsView = View.extend({
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
        },
        redirect_to_hits: function() {
            // Not enough data to render the hits view, navigate to the shopping view.
            alert('You must select shopping criteria before viewing hits.');
            window.location = '/sf/';
        }
    });

    return HitsView;
});