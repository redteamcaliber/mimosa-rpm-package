define(function (require) {
    var View = require('uac/common/View');

    /**
     * IOC details view of the shopping page.
     */
    var IOCDetailsView = View.extend({
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

    return IOCDetailsView;
});