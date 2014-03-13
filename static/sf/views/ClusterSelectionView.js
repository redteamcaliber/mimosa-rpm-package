define(function (require) {
    var View = require('uac/common/View');
    var SelectView = require('uac/common/SelectView');
    var utils = require('uac/common/utils');

    /**
     * Common component for displaying and selecting services, clients, and clusters.
     */
    var ClusterSelectionView = View.extend({
        /**
         * Render the selection view.
         */
        render: function () {
            var view = this;

            // Remove any existing event listeners.
            view.close();

            // Create the input form.
            view.$el.html(StrikeFinder.template('cluster-selection.ejs', {hide_services: view.options.hide_services}));

            var usersettings = utils.usersettings();

            if (view.options.hide_services !== true) {
                // Render the services.
                view.services = new StrikeFinder.ServicesCollection();
                view.services_view = new SelectView({
                    el: $("#services-select"),
                    collection: view.services,
                    id_field: "mcirt_service_name",
                    value_field: "description",
                    selected: utils.usersettings.services,
                    width: "100%"
                });
                view.services.reset(StrikeFinder.services);
                view.services_view.on('change', function () {
                    // Update the submit button.
                    view.update_options();
                });
            }

            // Render the clients.
            view.clients = new StrikeFinder.ClientCollection();
            view.clients_view = new SelectView({
                el: $('#clients-select'),
                collection: view.clients,
                id_field: 'client_uuid',
                value_field: 'client_name',
                selected: utils.usersettings.clients,
                width: '100%'
            });
            view.clients.reset(StrikeFinder.clients);
            view.clients_view.on('change', function () {
                // Reload the clusters based on the selected clients.
                view.load_clusters();
                // Update the submit button.
                view.update_options();
            });

            // Render the clusters.
            view.clusters = new StrikeFinder.ClustersCollection();
            view.clusters_view = new SelectView({
                el: $("#clusters-select"),
                collection: view.clusters,
                id_field: "cluster_uuid",
                value_field: "cluster_name",
                selected: utils.usersettings.clusters,
                width: "100%"
            });
            view.clusters_view.on('change', function () {
                // Update the submit button.
                view.update_options();
            });
            // Load the initial clusters options based on the clients.
            view.load_clusters();

            // Register event handlers.
            view.delegateEvents({
                'click #submit-button': 'on_submit',
                'click #clear-button': 'on_clear'
            });
        },
        /**
         * Clean up after this view.
         */
        close: function () {
            this.undelegateEvents();
        },
        /**
         * Load the clusters options based on the current clients selection.  Don't load any clusters that correspond to
         * a client that is currently selected.
         */
        load_clusters: function () {
            var view = this;
            var clusters = [];

            // Create a map of the selected client ids.
            var clients = view.get_selected_clients();
            var client_map = {};
            clients.forEach(function (client_uuid) {
                client_map[client_uuid] = client_uuid;
            });

            // Obtain the list of available clusters.
            StrikeFinder.clusters.forEach(function (cluster) {
                if (!(cluster.client_uuid in client_map)) {
                    clusters.push(cluster);
                }
            });

            view.clusters.reset(clusters);
        },
        /**
         * Retrieve the set of clusters based on both the clients and clusters selections.
         */
        get_clusters: function () {
            var view = this;
            var services = view.get_selected_services();
            var clients = view.get_selected_clients();
            var clusters = view.get_selected_clusters();

            // Consolidate the clusters parameters.  Use the clusters corresponding to all selected clients as well as
            // any individually selected clusters.
            var clusters_map = {};
            clients.forEach(function (client_uuid) {
                StrikeFinder.clusters.forEach(function (cluster) {
                    if (cluster.client_uuid == client_uuid && (!(cluster.cluster_uuid in clusters_map))) {
                        clusters_map[cluster.cluster_uuid] = cluster.cluster_uuid;
                    }
                });
            });
            clusters.forEach(function (cluster_uuid) {
                if (!(cluster_uuid in clusters_map)) {
                    clusters_map[cluster_uuid] = cluster_uuid;
                }
            });

            return _.keys(clusters_map);
        },
        /**
         * Get the selected services.
         */
        get_selected_services: function () {
            return this.options.hide_services === true ? [] : this.services_view.get_selected();
        },
        /**
         * Get the selected clients.
         */
        get_selected_clients: function () {
            return this.clients_view.get_selected();
        },
        /**
         * Get the selected clusters, not consolidated.
         */
        get_selected_clusters: function () {
            return this.clusters_view.get_selected();
        },
        /**
         * Call this method to enable or disable the submit button.
         * @param enabled - true or false, defaults to true.
         */
        enable_submit: function (enabled) {
            this.$el.find('#submit-button').prop('disabled', enabled === false);
        },
        /**
         * Call this method to enable or disable the clear button.
         * @param enabled - true or false, defaults to false.
         */
        enable_clear: function (enabled) {
            this.$el.find('#clear-button').prop('disabled', enabled === false);
        },
        /**
         * Update the submit button status based on the current form selections.  The button should only be enabled if a
         * service is selected and a client or clusters is selected.
         */
        update_options: function () {
            var submit_enabled;
            if (this.options.hide_services) {
                submit_enabled = this.get_selected_clients().length > 0 || this.get_selected_clusters().length > 0;
            }
            else {
                submit_enabled = this.get_selected_services().length > 0 && (this.get_selected_clients().length > 0 || this.get_selected_clusters().length > 0);
            }
            this.enable_submit(submit_enabled);
            this.enable_clear(submit_enabled);
        },
        /**
         * Handle the search submit request.
         */
        on_submit: function () {
            var view = this;

            // Trigger and event with the current services and merged clusters selections.
            view.trigger('submit', {
                services: view.get_selected_services(),
                clients: view.get_selected_clients(),
                clusters: view.get_selected_clusters(),
                merged_clusters: view.get_clusters()
            });
        },
        /**
         * Handle the clear button click.
         */
        on_clear: function () {
            if (this.options.hide_services !== true) {
                this.services_view.clear();
            }
            this.clients_view.clear();
            this.clusters_view.clear();
            this.trigger('clear');
        }
    });

    return ClusterSelectionView;
});