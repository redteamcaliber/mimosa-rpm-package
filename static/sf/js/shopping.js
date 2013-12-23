var StrikeFinder = StrikeFinder || {};

StrikeFinder.CheckoutView = StrikeFinder.View.extend({
    events: {
        "switch-change": "on_change"
    },
    render: function () {
        // Do nothing.
        return this;
    },
    on_change: function (ev, data) {
        this.trigger('switch-change', ev, data);
    }
});

StrikeFinder.IOCSummaryTableView = StrikeFinder.TableView.extend({
    initialize: function (options) {
        var view = this;
        if (!view.collection) {
            view.collection = new StrikeFinder.IOCSummaryCollection();
            view.listenTo(view.collection, 'sync', view.render);
        }

        options.aoColumns = [
            {sTitle: "IOC Name", mData: "iocname"},
            {sTitle: "Hash", mData: "iocnamehash", bVisible: false},
            {sTitle: "Supp", mData: "suppressed"},
            {sTitle: "Claimed", mData: "checkedoutexpressions"},
            {sTitle: "Total", mData: "totalexpressions", bVisible: false},
            {sTitle: "Open", mData: "open"},
            {sTitle: "In Progress", mData: "inprogress"},
            {sTitle: "Closed", mData: "closed"}
        ];
        options.aoColumnDefs = [
            {
                mRender: function (data, type, row) {
                    // Combine the checked out and total into the claimed column.
                    return row["checkedoutexpressions"] + " of " + row["totalexpressions"];
                },
                "aTargets": [3]
            }
        ];

        options.aaSorting = [
            [ 0, "asc" ]
        ];

        options.sDom = 'ftiS';

        view.options.iDisplayLength = 200;
        view.options.bScrollInfinite = true;
        view.options.bScrollCollapse = true;
        view.options.sScrollY = '600px';
        view.options.iScrollLoadGap = 200;
    }
});

/**
 * IOC details view of the shopping page.
 */
StrikeFinder.IOCDetailsView = StrikeFinder.View.extend({
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

        //var data = $.extend({}, view.options);
        //var items = view.collection.toJSON();
        //data.items = items;

        log.debug('Rendering IOC details...');

        var ioc_uuids = view.collection.toJSON();
        var iocname = 'NA';
        var iocnamehash = 'NA';
        if (view.collection.length > 0 && view.collection.at(0).get('expressions').length > 0) {
            var expresssions = view.collection.at(0).get('expressions');
            var iocname = expresssions[0].iocname;
            var iocnamehash = expresssions[0].iocnamehash;
        }

        // Render the template.
        view.$el.html(_.template($("#ioc-details-template").html(), {
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
            var table = new StrikeFinder.TableView({
                el: view.$("#uuid-" + index + "-table"),
                aaData: ioc_uuid.expressions,
                aoColumns: [
                    {sTitle: "exp_key", mData: "exp_key", bVisible: false},
                    {sTitle: "Expression", mData: "exp_string", sWidth: '50%', sClass: 'wrap'},
                    {sTitle: "Supp", mData: "suppressed", sWidth: '10%'},
                    {sTitle: "Claimed", mData: "checkedoutexpressions", sWidth: '10%'},
                    {sTitle: "Open", mData: "open", sWidth: '10%'},
                    {sTitle: "In Progress", mData: "inprogress", sWidth: '10%'},
                    {sTitle: "Closed", mData: "closed", sWidth: '10%'}
                ],
                aoColumnDefs: [
                    {
                        mRender: function (data, type, row) {
                            if (row["checkedoutexpressions"] > 0) {
                                return "Yes";
                            }
                            else {
                                return "No";
                            }
                        },
                        aTargets: [3]
                    }
                ],
                sDom: 't',
                iDisplayLength: -1
            });
            table.on("click", function (data) {
                var exp_key = data['exp_key'];
                view.trigger("click:exp_key", exp_key);
            });
            table.render();

            view.table_views.push(table);
        });
        return view;
    },
    on_ioc_click: function (ev) {
        this.trigger('click:iocnamehash', $(ev.currentTarget).attr('data-iocnamehash'));
    },
    on_uuid_click: function(ev) {
        this.trigger('click:ioc_uuid', $(ev.currentTarget).attr('data-ioc_uuid'));
    },
    fetch: function (params) {
        var view = this;
        view.params = params;
        StrikeFinder.block_element(view.$el);
        view.collection.fetch({
            data: params,
            success: function () {
                StrikeFinder.unblock(view.$el);
            },
            error: function () {
                StrikeFinder.unblock(view.$el);
            }
        });
    },
    close: function() {
        var view = this;
        if (view.table_views) {
            _.each(view.table_views, function (table_view) {
                table_view.close();
            });
        }
        view.table_views = [];
        view.undelegateEvents();
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
        view.shopping_collapsable = new StrikeFinder.CollapsableContentView({
            el: '#' + view.el.id
        });

        // Use the default title.
        view.set_title('');

        // Load the model with the users default search criteria.
        view.model = new StrikeFinder.UserCriteriaModel(StrikeFinder.usersettings);
        log.debug('Shopping defaults: ' + JSON.stringify(view.model.toJSON()));

        // Initialize the checkout view.
        view.checkout_view = new StrikeFinder.CheckoutView({
            el: $("#checkout-switch")
        });
        view.checkout_view.on('switch-change', function (ev, data) {
            view.model.set("checkout", data.value);
        });
        view.checkout_view.render();

        // Services options.
        view.services = new StrikeFinder.ServicesCollection();
        view.services_view = new StrikeFinder.SelectView({
            el: $("#services-select"),
            collection: view.services,
            id_field: "mcirt_service_name",
            value_field: "description",
            selected: view.model.get('services'),
            width: "100%"
        });
        view.services_view.on("change", function (services) {
            // Update the search criteria when values change.
            view.model.set("services", services);
        });
        view.services.reset(StrikeFinder.services);

        // Clusters options.
        view.clusters = new StrikeFinder.ClustersCollection();
        view.clusters_view = new StrikeFinder.SelectView({
            el: $("#clusters-select"),
            collection: view.clusters,
            id_field: "cluster_uuid",
            value_field: "cluster_name",
            selected: view.model.get('clusters'),
            width: "100%"
        });
        view.clusters_view.on('change', function (clusters) {
            // Update the model criteria when values change.
            view.model.set("clusters", clusters);
        });
        view.clusters.reset(StrikeFinder.clusters);

        // Initialize the IOC summary view.
        view.ioc_summaries_view = new StrikeFinder.IOCSummaryTableView({
            el: '#ioc-summary-table'
        });
        view.listenTo(view.ioc_summaries_view, 'click', function (data) {
            var iocname = data["iocname"];
            var iocnamehash = data["iocnamehash"];

            if (log.isDebugEnabled()) {
                log.debug("iocname: " + iocname + " with iocnamehash: " + iocnamehash + " was selected...");
            }

            view.model.set('iocname', iocname);
            view.model.set("iocnamehash", iocnamehash);

            view.render_details();
        });
        view.listenTo(view.ioc_summaries_view, 'row:created', function (row, data, index) {
            // Add the iocnamehash as a class.
            $(row).addClass(data['iocnamehash']);
        });

        // Initialize the IOC details view.
        view.ioc_details_view = new StrikeFinder.IOCDetailsView({
            el: "#ioc-details-div"
        });
        view.listenTo(view.ioc_details_view, "click:exp_key", function (exp_key) {
            log.debug('User selected exp_key: ' + exp_key);

            // User has selected an expression.
            view.model.set("exp_key", exp_key);

            var params = {
                services: view.model.get('services'),
                clusters: view.model.get('clusters'),
                exp_key: view.model.get('exp_key'),
                checkout: view.model.get('checkout')
            };

            view.render_hits(params);
        });
        view.listenTo(view.ioc_details_view, "click:iocnamehash", function (iocnamehash) {
            log.debug('User has selected iocnamehash: ' + iocnamehash)
            // User has selected an iocnamehash.
            view.model.set('iocnamehash', iocnamehash);

            var params = {
                services: view.model.get('services'),
                clusters: view.model.get('clusters'),
                iocnamehash: view.model.get('iocnamehash'),
                checkout: view.model.get('checkout')
            };

            view.render_hits(params);
        });

        // Listen for search model criteria changes.
        view.model.on("change", function (ev) {
            var changed = ev.changed;
            if (changed["services"] || changed["clusters"]) {
                // If the services or clusters have changed then update the summary table.
                view.render_summaries();
            }
            else if (changed["namehash"]) {
                // If the namehash has changed then update the details table.
                view.render_details();
            }
        });

        view.render_summaries();
    },
    set_title: function (title) {
        this.shopping_collapsable.set('title', '<i class="fa fa-search"></i> IOC Selection' + title);
    },
    render_summaries: function () {
        var view = this;
        view.ioc_details_view.hide();
        if (view.model.is_required_params_set()) {
            $('#ioc-summary-div').fadeIn().show();
            var params = {
                services: view.model.get('services').join(','),
                clusters: view.model.get('clusters').join(',')
            };
            view.ioc_summaries_view.fetch({
                data: params
            });
        }
        else {
            $("#ioc-summary-div").fadeOut().hide();
        }
    },
    render_details: function () {
        var view = this;
        if (view.model.is_required_params_set()) {
            view.ioc_details_view.show();
            //view.ioc_details_view.options['legend'] = view.model.get('iocname');
            var params = {
                services: view.model.get('services').join(','),
                clusters: view.model.get('clusters').join(','),
                iocnamehash: view.model.get('iocnamehash')
            };
            view.ioc_details_view.fetch(params);
        }
    },
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