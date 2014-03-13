var StrikeFinder = StrikeFinder || {};


/**
 * IOC details table view.
 */
StrikeFinder.IOCDetailsTableView = UAC.TableView.extend({
    initialize: function () {
        var view = this;

        view.options.aoColumns = [
            {sTitle: "exp_key", mData: "exp_key", bVisible: false},
            {sTitle: "Expression", mData: "exp_key", sWidth: '50%'},
            {sTitle: "Supp", mData: "suppressed", sWidth: '10%'},
            {sTitle: "Open", mData: "open", sWidth: '10%'},
            {sTitle: "In Progress", mData: "inprogress", sWidth: '10%'},
            {sTitle: "Closed", mData: "closed", sWidth: '10%'}
        ];

        view.options.aoColumnDefs = [
            {
                mRender: function (data, type, row) {
                    // Display <rowitem_type> (<exp_key>)
                    return _.sprintf('%s (%s)', row.rowitem_type, data);
                },
                aTargets: [1]
            }
        ];

        view.options.sDom = 't';
        view.options.iDisplayLength = -1;

        view.expression_views = [];

        view.listenTo(view, 'row:created', function (row, data) {
            var expression_view = new StrikeFinder.ExpressionView({
                el: $(row),
                model: new Backbone.Model(data)
            });
            expression_view.render();
            view.expression_views.push(expression_view);
        });
    },
    close: function () {
        this.stopListening();
        _.each(this.expression_views, function(ev) {
            ev.close();
        });
    }
});

/**
 * IOC details view of the shopping page.
 */
StrikeFinder.IOCDetailsView = UAC.View.extend({
    initialize: function () {
        if (!this.collection) {
            this.collection = new StrikeFinder.IOCDetailsCollection();
        }
        this.listenTo(this.collection, 'sync', this.render);
    },
    render: function () {
        var view = this;

        // Clean up any previous view data.
        view.close();

        log.debug('Rendering IOC details...');

        var ioc_uuids = view.collection.toJSON();
        var iocname = 'NA';
        var iocnamehash = 'NA';
        if (view.collection.length > 0 && view.collection.at(0).get('expressions').length > 0) {
            var expresssions = view.collection.at(0).get('expressions');
            iocname = expresssions[0].iocname;
            iocnamehash = expresssions[0].iocnamehash;
        }

        // Render the template.
        view.$el.html(StrikeFinder.template('ioc-details.ejs', {
            items: ioc_uuids,
            iocname: iocname,
            iocnamehash: iocnamehash
        }));

        // Register events.
        view.delegateEvents({
            'click .iocnamehash': 'on_ioc_click',
            'click .ioc_uuid': 'on_uuid_click'
        });

        _.each(ioc_uuids, function (ioc_uuid, index) {

            var table = new StrikeFinder.IOCDetailsTableView({
                el: view.$("#uuid-" + index + "-table"),
                aaData: ioc_uuid.expressions
            });

            table.listenTo(table, 'click', function (data) {
                var exp_key = data['exp_key'];

                // Trigger an event passing the IOC name, IOC UUID, and the IOC expression.
                view.collection.each(function (iocuuid_item) {
                    _.each(iocuuid_item.get('expressions'), function (expression_item) {
                        if (expression_item.exp_key == exp_key) {
                            view.trigger("click:exp_key", expression_item.iocname, expression_item.iocuuid, exp_key);
                        }
                    });
                });
                // Remove the selections from any of the other details tables that may already have a previous selection.
                _.each(view.table_views, function (table) {
                    var selected = table.get_selected_data();
                    if (selected && selected.exp_key != exp_key) {
                        table.select_row(undefined);
                    }
                });
            });
            table.render();

            view.table_views.push(table);
        });
        return view;
    },
    on_ioc_click: function (ev) {
        var view = this;
        var iocnamehash = $(ev.currentTarget).attr('data-iocnamehash');

        view.collection.each(function (iocuuid_item) {
            _.each(iocuuid_item.get('expressions'), function (expression_item) {
                if (expression_item.iocnamehash == iocnamehash) {
                    view.trigger('click:iocnamehash', expression_item.iocname, iocnamehash);
                }
            });
        });
    },
    on_uuid_click: function (ev) {
        var view = this;
        var iocuuid = $(ev.currentTarget).attr('data-ioc_uuid');

        view.collection.each(function (iocuuid_item) {
            _.each(iocuuid_item.get('expressions'), function (expression_item) {
                if (expression_item.iocuuid == iocuuid) {
                    view.trigger('click:ioc_uuid', expression_item.iocname, iocuuid);
                }
            });
        });
    },
    fetch: function (params) {
        var view = this;
        view.params = params;
        UAC.block_element(view.$el);
        view.collection.fetch({
            data: params,
            success: function () {
                UAC.unblock(view.$el);
            },
            error: function () {
                UAC.unblock(view.$el);
            }
        });
    },
    close: function () {
        var view = this;
        if (view.table_views) {
            _.each(view.table_views, function (table_view) {
                table_view.close();
            });
        }
        view.table_views = [];
    }
});

/**
 * Common component for displaying and selecting services, clients, and clusters.
 */
StrikeFinder.ClusterSelectionView = UAC.View.extend({
    /**
     * Render the selection view.
     */
    render: function () {
        var view = this;

        // Remove any existing event listeners.
        view.close();

        // Create the input form.
        view.$el.html(StrikeFinder.template('cluster-selection.ejs', {hide_services: view.options.hide_services}));

        var usersettings = UAC.usersettings();

        if (view.options.hide_services !== true) {
            // Render the services.
            view.services = new StrikeFinder.ServicesCollection();
            view.services_view = new UAC.SelectView({
                el: $("#services-select"),
                collection: view.services,
                id_field: "mcirt_service_name",
                value_field: "description",
                selected: usersettings.services,
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
        view.clients_view = new UAC.SelectView({
            el: $('#clients-select'),
            collection: view.clients,
            id_field: 'client_uuid',
            value_field: 'client_name',
            selected: usersettings.clients,
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
        view.clusters_view = new UAC.SelectView({
            el: $("#clusters-select"),
            collection: view.clusters,
            id_field: "cluster_uuid",
            value_field: "cluster_name",
            selected: usersettings.clusters,
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

/**
 * The main shopping view.
 */
StrikeFinder.ShoppingView = Backbone.View.extend({
    initialize: function () {
        // ShoppingView reference.
        var view = this;

        // Add a collapsable around the shopping view.
        view.shopping_collapsable = new UAC.CollapsableContentView({
            el: '#' + view.el.id
        });

        // Use the default title.
        view.set_title();

        // Create the cluster selection component.
        view.cluster_selection_view = new StrikeFinder.ClusterSelectionView({
            el: '#cluster-selection-div'
        });
        view.listenTo(view.cluster_selection_view, 'submit', function (params) {
            // Update the services, clients, and clusters user settings on submit.
            UAC.usersettings({
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
        view.ioc_summaries_view = new StrikeFinder.IOCSummaryTableView({
            el: '#ioc-summary-table'
        });
        view.listenTo(view.ioc_summaries_view, 'click', function (data) {
            // Handle the click of a row on the IOC summary view.  Load the related IOC details.
            var iocname = data["iocname"];
            var iocnamehash = data["iocnamehash"];

            if (log.isDebugEnabled()) {
                log.debug("iocname: " + iocname + " with iocnamehash: " + iocnamehash + " was selected...");
            }

            UAC.usersettings({iocnamehash: iocnamehash});

            view.render_details(iocnamehash);
        });
        // If there is an iocnamehash in the user settings then select it in the summary table.
        if (UAC.usersettings().iocnamehash) {
            view.listenTo(view.ioc_summaries_view, 'load', function () {
                var iocnamehash = UAC.usersettings().iocnamehash;
                if (iocnamehash) {
                    view.ioc_summaries_view.select(iocnamehash);
                }
            });
        }

        // Initialize the IOC details view.
        view.ioc_details_view = new StrikeFinder.IOCDetailsView({
            el: "#ioc-details-div"
        });
        view.listenTo(view.ioc_details_view, "click:exp_key", function (iocname, iocuuid, exp_key) {
            log.info('Selected expression key: ' + exp_key);

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
            log.info('Selected iocnamehash: ' + iocnamehash);

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
            log.debug('Selected ioc_uuid: ' + ioc_uuid);

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
     * @param title - the title.
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
            view.hits_view = new StrikeFinder.HitsView({
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

StrikeFinder.ExpressionView = UAC.View.extend({
    render: function () {
        var view = this;

        var exp_string = view.model.get('exp_string');
        var tokens = exp_string.split(/(AND)|(OR)/);

        var text = '';
        _.each(tokens, function (token) {
            if (!token) {

            }
            else if (token == 'AND' || token == 'OR') {
                text += token + '\n';
            }
            else {
                text += token;
            }
        });

        view.$el.popover({
            html: true,
            trigger: 'hover',
            content: '<pre style="border: 0; margin: 2px; font-size: 85%; overflow: auto">' + text + '</pre>',
            placement: 'left'
        })
            .data('bs.popover')
            .tip()
            .addClass('expression-popover');
    },
    close: function () {
        this.stopListening();
        this.$el.popover('destroy');
        // Manually removing the popover due to -> https://github.com/twbs/bootstrap/issues/10335
        this.$el.parent().find('.popover').remove();
    }
});