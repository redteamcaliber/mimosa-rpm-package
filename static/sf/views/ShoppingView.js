/**
 * View to select an IOC name, expression, or UUID.
 */
define(function (require) {
    var uac_utils = require('uac/common/utils');
    var View = require('uac/views/View');
    var TableView = require('uac/views/TableView');

    var IOCSummaryCollection = require('sf/models/IOCSummaryCollection');
    var IOCDetailsCollection = require('sf/models/IOCDetailsCollection');

    var ClusterSelectionView = require('sf/views/ClusterSelectionView');
    var HitsView = require('sf/views/HitsView');
    var templates = require('sf/ejs/templates');


    //
    // View class to display a textual representation of the IOC expression.
    //
    var ExpressionView = View.extend({
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

    //
    // IOC Summary table view.
    //
    var IOCSummaryTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            if (!view.collection) {
                view.collection = new IOCSummaryCollection();
                view.listenTo(view.collection, 'sync', view.render);
            }

            options.aoColumns = [
                {sTitle: "IOC Name", mData: "iocname"},
                {sTitle: "Hash", mData: "iocnamehash", bVisible: false},
                {sTitle: "Supp", mData: "suppressed"},
                {sTitle: "Total", mData: "totalexpressions", bVisible: false},
                {sTitle: "Open", mData: "open"},
                {sTitle: "In Progress", mData: "inprogress"},
                {sTitle: "Closed", mData: "closed"}
            ];

            options.aaSorting = [
                [ 0, "asc" ]
            ];

            options.sDom = 'ftiS';

            options.iDisplayLength = 200;
            options.bScrollInfinite = true;
            options.bScrollCollapse = true;
            options.sScrollY = '600px';
            options.iScrollLoadGap = 200;

            view.listenTo(view, 'row:created', function (row, data) {
                $(row).addClass(view._get_class(data.iocnamehash));
            });

            view.$('table').addClass('table').addClass('table-bordered').addClass('table-condensed').addClass('table-hover')
        },
        select: function (iocnamehash) {
            console.log('Selecting iocnamehash: ' + iocnamehash);
            var row = $('.' + this._get_class(iocnamehash));
            if (row.length == 1) {
                this.select_row(row);
            }
        },
        _get_class: function (iocnamehash) {
            return 'iocnamehash-' + iocnamehash;
        }
    });

    /**
     * IOC details table view.
     */
    IOCDetailsTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            options.aoColumns = [
                {sTitle: "exp_key", mData: "exp_key", bVisible: false},
                {sTitle: "Expression", mData: "exp_key", sWidth: '50%'},
                {sTitle: "Supp", mData: "suppressed", sWidth: '10%'},
                {sTitle: "Open", mData: "open", sWidth: '10%'},
                {sTitle: "In Progress", mData: "inprogress", sWidth: '10%'},
                {sTitle: "Closed", mData: "closed", sWidth: '10%'}
            ];

            options.aoColumnDefs = [
                {
                    mRender: function (data, type, row) {
                        // Display <rowitem_type> (<exp_key>)
                        return _.sprintf('%s (%s)', row.rowitem_type, data);
                    },
                    aTargets: [1]
                }
            ];

            options.sDom = 't';
            options.iDisplayLength = -1;

            view.expression_views = [];

            view.listenTo(view, 'row:created', function (row, data) {
                var expression_view = new ExpressionView({
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
    var IOCDetailsView = View.extend({
        initialize: function (options) {
            this.options = options;

            if (!this.collection) {
                this.collection = new IOCDetailsCollection();
            }
            this.listenTo(this.collection, 'sync', this.render);
        },
        render: function () {
            var view = this;

            // Clean up any previous view data.
            view.close();

            console.log('Rendering IOC details...');

            var ioc_uuids = view.collection.toJSON();
            var iocname = 'NA';
            var iocnamehash = 'NA';
            if (view.collection.length > 0 && view.collection.at(0).get('expressions').length > 0) {
                var expresssions = view.collection.at(0).get('expressions');
                iocname = expresssions[0].iocname;
                iocnamehash = expresssions[0].iocnamehash;
            }

            // Render the template.
            view.apply_template(templates, 'ioc-details.ejs', {
                items: ioc_uuids,
                iocname: iocname,
                iocnamehash: iocnamehash
            });

            // Register events.
            view.delegateEvents({
                'click .iocnamehash': 'on_ioc_click',
                'click .ioc_uuid': 'on_uuid_click'
            });

            _.each(ioc_uuids, function (ioc_uuid, index) {

                var table = new IOCDetailsTableView({
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
            view.block_element(view.$el);
            view.collection.fetch({
                data: params,
                success: function () {
                    view.unblock(view.$el);
                },
                error: function () {
                    view.unblock(view.$el);
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
     * The main shopping view.
     */
    var ShoppingView = View.extend({
        initialize: function (options) {
            // ShoppingView reference.
            var view = this;
            view.options = options;

            // Render the shopping template.
            view.apply_template(templates, 'shopping-layout.ejs');

            // Create the cluster selection component.
            view.cluster_selection_view = new ClusterSelectionView();
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
            view.$('#cluster-selection').append(view.cluster_selection_view.render().el);

            // Initialize the IOC summary view.
            view.summaries = new IOCSummaryCollection();
            view.ioc_summaries_view = new IOCSummaryTableView({
                id: 'ioc-summary-table',
                collection: view.summaries
            });
            view.ioc_summaries_view.$el.addClass('table').addClass('table-bordered');
            view.$('#ioc-summary').append(view.ioc_summaries_view.el);

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
                el: view.$('#ioc-details-div')
            });
            view.listenTo(view.ioc_details_view, "click:exp_key", function (iocname, iocuuid, exp_key) {
                console.log('Selected expression key: ' + exp_key);

                var params = {
                    services: view.services.join(','),
                    clusters: view.clusters.join(),
                    exp_key: exp_key
                };

                view.render_hits(params);

                view.trigger('render:hits', [iocname, iocuuid, exp_key]);
            });
            view.listenTo(view.ioc_details_view, "click:iocnamehash", function (iocname, iocnamehash) {
                // User has selected an iocnamehash.
                console.log('Selected iocnamehash: ' + iocnamehash);

                var params = {
                    services: view.services.join(','),
                    clusters: view.clusters.join(','),
                    iocnamehash: iocnamehash
                };

                // Check out is not enabled.
                view.render_hits(params);

                view.trigger('render:hits', [iocname]);
            });
            view.listenTo(view.ioc_details_view, "click:ioc_uuid", function (iocname, ioc_uuid) {
                // User has selected an ioc_uuid.
                console.log('Selected ioc_uuid: ' + ioc_uuid);

                var params = {
                    services: view.services.join(','),
                    clusters: view.clusters.join(','),
                    ioc_uuid: ioc_uuid
                };

                view.render_hits([iocname, ioc_uuid]);
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

            return title;
        },
        /**
         * Hide the IOC summary view.
         */
        hide_summaries: function () {
            this.$('#ioc-summary-div').fadeOut().hide();
        },
        /**
         * Show the IOC summary view.
         */
        show_summaries: function () {
            this.$('#ioc-summary-div').fadeIn().show();
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

            // Display the hits view.
            view.hits_view.show();
        }
    });

    return ShoppingView;
});