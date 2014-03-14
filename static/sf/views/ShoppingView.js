define(function (require) {
    var $ = require('jquery');
    var Backbone = require('backbone');

    var CollapsableContentView = require('uac/views/CollapsableContentView');
    var IOCSummaryTableView = require('sf/views/IOCSummaryTableView');
    var ClusterSelectionView = require('sf/views/ClusterSelectionView');
    var IOCDetailsView = require('sf/views/IOCDetailsView');
    var HitsView = require('sf/views/HitsView');

    uac_utils = require('uac/common/utils');

    /**
     * The main shopping view.
     */
    var ShoppingView = Backbone.View.extend({
        initialize: function () {
            // ShoppingView reference.
            var view = this;

            // Add a collapsable around the shopping view.
            view.shopping_collapsable = new CollapsableContentView({
                el: '#' + view.el.id
            });

            // Use the default title.
            view.set_title();

            // Create the cluster selection component.
            view.cluster_selection_view = new ClusterSelectionView({
                el: '#cluster-selection-div'
            });
            view.listenTo(view.cluster_selection_view, 'submit', function (params) {
                // Update the services, clients, and clusters user settings on submit.
                uac_utils.usersettings({
                    services: params.services,
                    clients: params.clients,
                    clusters: params.clusters,
                    iocnamehash: undefined,
                    ioc_uuid: undefined,
                    exp_key: undefined
                });

                // Update the IOC summary view on submit.
                view.render_summaries({
                    services: params.services,
                    clusters: params.merged_clusters
                });
            });
            view.listenTo(view.cluster_selection_view, 'clear', function () {
                view.hide_summaries();
                view.hide_details();
            });
            view.cluster_selection_view.render();

            // Initialize the IOC summary view.
            view.ioc_summaries_view = new IOCSummaryTableView({
                el: '#ioc-summary-table'
            });
            view.listenTo(view.ioc_summaries_view, 'click', function (data) {
                // Handle the click of a row on the IOC summary view.  Load the related IOC details.
                var iocname = data["iocname"];
                var iocnamehash = data["iocnamehash"];

                console.log("iocname: " + iocname + " with iocnamehash: " + iocnamehash + " was selected...");

                uac_utils.usersettings({iocnamehash: iocnamehash});

                view.render_details(iocnamehash);
            });

            // If there is an iocnamehash in the user settings then select it in the summary table.
            if (uac_utils.usersettings().iocnamehash) {
                view.listenTo(view.ioc_summaries_view, 'load', function () {
                    var iocnamehash = uac_utils.usersettings().iocnamehash;
                    if (iocnamehash) {
                        view.ioc_summaries_view.select(iocnamehash);
                    }
                });
            }

            // Initialize the IOC details view.
            view.ioc_details_view = new IOCDetailsView({
                el: "#ioc-details-div"
            });
            view.listenTo(view.ioc_details_view, "click:exp_key", function (iocname, iocuuid, exp_key) {
                console.log('Selected expression key: ' + exp_key);

                // Update the window title.
                document.title = _.sprintf('Hits-%s-%s-%s', iocname, iocuuid, exp_key);

                // Update the title of the collapsable.
                view.set_title([iocname, iocuuid, exp_key]);

                var params = {
                    services: view.services.join(','),
                    clusters: view.clusters.join(),
                    exp_key: exp_key
                };

                view.render_hits(params);
            });
            view.listenTo(view.ioc_details_view, "click:iocnamehash", function (iocname, iocnamehash) {
                // User has selected an iocnamehash.
                console.log('Selected iocnamehash: ' + iocnamehash);

                // Update the window title.
                document.title = _.sprintf('Hits-%s', iocname);

                // Update the title of the collapsable.
                view.set_title([iocname]);

                var params = {
                    services: view.services.join(','),
                    clusters: view.clusters.join(','),
                    iocnamehash: iocnamehash
                };

                // Check out is not enabled.
                view.render_hits(params);
            });
            view.listenTo(view.ioc_details_view, "click:ioc_uuid", function (iocname, ioc_uuid) {
                // User has selected an ioc_uuid.
                console.log('Selected ioc_uuid: ' + ioc_uuid);

                // Update the window title.
                document.title = _.sprintf('Hits-%s-%s', iocname, ioc_uuid);

                // Update the title of the collapsable.
                view.set_title([iocname, ioc_uuid]);

                var params = {
                    services: view.services.join(','),
                    clusters: view.clusters.join(','),
                    ioc_uuid: ioc_uuid
                };

                view.render_hits(params);
            });

            // Attempt to display the summary data based on the current user settings.
            view.render_summaries({
                services: view.cluster_selection_view.get_selected_services(),
                clusters: view.cluster_selection_view.get_clusters()
            });
        },
        get_selected_ioc_summary_data: function () {
            return this.ioc_summaries_view.get_selected_data();
        },
        /**
         * Set the IOC selection roll up title.
         */
        set_title: function (items) {
            var title = '<i class="fa fa-search"></i> IOC Selection';
            if (items && items.length > 0) {
                _.each(items, function (item) {
                    title += ' &nbsp; / &nbsp; ' + item;
                });
            }
            this.shopping_collapsable.set('title', title);

            return title;
        },
        /**
         * Hide the IOC summary view.
         */
        hide_summaries: function () {
            $('#ioc-summary-div').fadeOut().hide();
        },
        /**
         * Show the IOC summary view.
         */
        show_summaries: function () {
            $('#ioc-summary-div').fadeIn().show();
        },
        /**
         * Hide the IOC details view.
         */
        hide_details: function () {
            if (this.ioc_details_view) {
                this.ioc_details_view.hide();
            }
        },
        /**
         * Retrieve and display the IOC summary data.
         */
        render_summaries: function (params) {
            var view = this;

            view.services = params.services;
            view.clusters = params.clusters;

            if (view.services.length > 0 && view.clusters.length > 0) {
                // Hide the IOC details.
                view.hide_details();


                // Fetch the summary data.
                view.ioc_summaries_view.fetch({
                    data: {
                        services: view.services.join(','),
                        clusters: view.clusters.join(',')
                    }
                });

                // Display the ioc summary.
                view.show_summaries();
            }
        },
        /**
         * Retrieve and display the IOC details data.
         * @param iocnamehash - the selected IOC name hash value.
         */
        render_details: function (iocnamehash) {
            var view = this;
            view.ioc_details_view.fetch({
                services: view.services.join(','),
                clusters: view.clusters.join(','),
                iocnamehash: iocnamehash
            });
            view.ioc_details_view.show();
        },
        /**
         * Navigate to the hits view with the specified parameters.
         * @param params - the parameters (services, clusters, exp_key, iocnamehash, ioc_uuid).
         */
        render_hits: function (params) {
            var view = this;

            if (!view.hits_view) {
                // Create the hits view.
                view.hits_view = new HitsView({
                    el: '#hits-view-div'
                });
            }

            // Fetch the hits data.
            view.hits_view.fetch(params);

            if (view.shopping_collapsable) {
                // Toggle the shopping collapsable.
                view.shopping_collapsable.toggle();
            }

            // Display the hits view.
            view.hits_view.show();
        }
    });

    return ShoppingView;
});