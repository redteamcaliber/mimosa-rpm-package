var StrikeFinder = StrikeFinder || {};


StrikeFinder.View = Backbone.View.extend({
    show: function () {
        this.$el.fadeIn().show();
    },
    hide: function () {
        this.$el.fadeOut().hide();
    },
    run_once: function (key, init_function) {
        if (!this[key]) {
            this[key] = true;
            init_function();
            return true;
        }
        else {
            return false;
        }
    },
    render: function () {
        var view = this;
        var args = arguments;
        if (this.do_render !== undefined) {
            StrikeFinder.run(function () {
                view.do_render.apply(view, args);
            });
        }
        return view;
    }
});

/**
 * Wrap an element with a collapsable view.
 */
StrikeFinder.CollapsableContentView = StrikeFinder.View.extend({
    initialize: function (options) {
        this.name = options['name'];
        if (!this.name) {
            if (this.el && this.el.id) {
                this.name = this.el.id;
            }
            else {
                log.error('"name" or "el.id" is undefined.');
                return;
            }
        }
        this.collapsed = options['collapsed'];
        this.title = options['title'];
        this.title_class = options['title_class'];

        this.render();
    },
    render: function () {
        var view = this;

        view.run_once('init_render', function () {
            // Create the accordion inner div.
            var accordion_inner = $(document.createElement('div'));
            accordion_inner.addClass('accordion-inner');
            view.$el.wrap(accordion_inner);
            accordion_inner = view.$el.parent();

            // Create the accordion body.
            var accordion_body = $(document.createElement('div'));
            accordion_body.attr('id', 'collapse-' + view.name);
            accordion_body.addClass('accordion-body');
            accordion_body.addClass('collapse');
            if (!view.collapsed) {
                accordion_body.addClass('in');
            }
            accordion_inner.wrap(accordion_body);
            accordion_body = accordion_inner.parent();

            // Create the accordion group div.
            var accordion_group = $(document.createElement('div'));
            accordion_group.addClass('accordion-group');
            accordion_body.wrap(accordion_group);
            accordion_group = accordion_body.parent();

            // Create the accordion div.
            var accordion = $(document.createElement('div'));
            accordion.attr('id', view.name + '-accordion');
            accordion.addClass('accordion');
            accordion_group.wrap(accordion);

            // Create the title.
            var title_span = $(document.createElement('span'));
            title_span.attr('id', view.name + '-title');
            if (view.title_class) {
                title_span.addClass(view.title_class);
            }
            if (view.title) {
                title_span.html(view.title);
            }

            // Create the icon.
            var icon = $(document.createElement('i'));
            icon.addClass('icon-chevron-sign-down');
            icon.addClass('icon-large');
            icon.addClass('pull-right');

            // Create the accordion anchor.
            var anchor = $(document.createElement('a'));
            anchor.addClass('accordion-toggle');
            anchor.attr('data-toggle', 'collapse');
            anchor.attr('data-parent', view.name + '-accordion');
            anchor.attr('href', '#collapse-' + view.name);

            anchor.append(title_span);
            anchor.append(icon);

            // Create the accordion heading div.
            var heading_div = $(document.createElement('div'));
            heading_div.addClass('accordion-heading');
            heading_div.append(anchor);

            accordion_group.prepend(heading_div);
        });

        return this;
    },
    get_accordion_inner: function () {
        return this.$el.closest('.accordion-inner');
    },
    get_accordion: function () {
        return this.$el.closest('.accordion');
    },
    show: function () {
        // Show the accordion decorator.
        this.get_accordion().fadeIn().show();
    },
    hide: function () {
        // Hide the accordion decorator.
        this.get_accordion().fadeOut().hide();
    },
    set: function (key, value) {
        if (key && key == 'title') {
            $('#' + this.name + '-title').html(value);
        }
    },
    toggle: function () {
        $('#collapse-' + this.el.id).collapse('toggle');
    }
});

StrikeFinder.TableViewControls = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;
        view.table = view.options['table'];
        if (!view.table) {
            log.warn('"table" is undefined.');
        }
        if (view.table !== undefined) {
            view.listenTo(view.table, 'click', view.render);
        }
    },
    events: {
        'click a.prev': 'on_prev',
        'click a.next': 'on_next'
    },
    render: function () {
        var view = this;

        view.run_once('init_template', function () {
            // Only write the template once.
            view.$el.html(_.template($('#prev-next-template').html()));
        });

        if (view.table !== undefined) {
            if (view.table.is_prev()) {
                view.$('a.prev').removeAttr('disabled');
            }
            else {
                view.$('a.prev').attr('disabled', true);
            }

            if (view.table.is_next()) {
                view.$('a.next').removeAttr('disabled');
            }
            else {
                view.$('a.next').attr('disabled', true);
            }
        }
    },
    on_prev: function () {
        if (this.table !== undefined) {
            this.table.prev();
        }
    },
    on_next: function () {
        if (this.table !== undefined) {
            this.table.next();
        }
    },
    close: function () {
        this.stopListening();
    }
});

StrikeFinder.get_datatables_settings = function (parent, settings) {
    var defaults = {
        iDisplayLength: 10,
        aLengthMenu: [10, 25, 50, 100, 200],
        sDom: "t",
        bAutoWidth: false,
        sPaginationType: "bootstrap",
        bSortClasses: false,
        bProcessing: false,
        oLanguage: {
            sEmptyTable: "&lt;No Results Found&gt;"
        },
        asStripClasses: [],
        fnRowCallback: function (nRow, data, iDisplayIndex, iDisplayIndexFull) {
            var click_handler = function (ev) {
                // Select the row.
                $(nRow).addClass('info').siblings().removeClass('info');
                // Trigger a click event.
                parent.trigger('click', parent.get_data(ev.currentTarget));
            };

            // Remove any existing click events for the row.
            $(nRow).unbind('click', click_handler);
            // Bind a click event to the row.
            $(nRow).bind('click', click_handler);
        },
        fnCreatedRow: function (nRow, aData, iDataIndex) {
            parent.trigger('row:created', nRow, aData, iDataIndex);
        },
        fnInitComplete: function (oSettings, json) {
            parent.trigger('load', oSettings, json);
        },
        fnDrawCallback: function (oSettings) {
            parent.trigger('draw', oSettings);
            if (parent.length() == 0) {
                parent.trigger('empty');
            }
        }
    };

    //return $.extend(true, defaults, settings);
    var results = {};

    _.each(Object.keys(defaults), function (key) {
        results[key] = defaults[key];
    });

    _.each(Object.keys(settings), function (key) {
        results[key] = settings[key];
    });

    return results;
};

/**
 * Generic Backbone table view component.
 */
StrikeFinder.TableView = StrikeFinder.View.extend({
    initialize: function () {
        if (this.collection) {
            this.listenTo(this.collection, 'sync', this.render);
        }
    },
    highlight_row: function (nRow) {
        $(nRow).addClass('info').siblings().removeClass('info');
    },
    select_row: function (index) {
        var length = this.length();

        if (this.length() <= 0) {
            return undefined;
        }
        else if (index + 1 > length) {
            return undefined;
        }
        else {
            var pos = this.get_selected_position();
            if (pos != index) {
                // Only select if we are not already on the row.
                var node = this.get_nodes(index);
                if (node) {
                    $(node).click();
                }
                return node;
            }
            else {
                return undefined;
            }
        }
    },
    get_selected: function () {
        return this.$('tr.info');
    },
    get_selected_position: function () {
        var selected = this.get_selected();
        if (selected !== undefined && selected.length == 1) {
            return this.get_position(selected.get(0));
        }
        else {
            return -1;
        }
    },
    is_prev: function () {
        var pos = this.get_selected_position();
        return (pos > 0);
    },
    is_next: function () {
        var pos = this.get_selected_position();
        return pos + 1 < this.length();
    },
    prev: function () {
        var selected = this.get_selected();
        if (selected !== undefined && selected.length == 1) {
            var pos = this.get_position(selected.get(0));
            this.select_row(pos - 1);
        }
    },
    next: function () {
        if (this.is_next()) {
            var selected = this.get_selected();
            if (selected !== undefined && selected.length == 1) {
                var pos = this.get_position(selected.get(0));
                this.select_row(pos + 1);
            }
        }
    },
    length: function () {
        return this.$el.fnGetData().length;
    },
    get_dom_table: function () {
        return this.$el.get(0);
    },
    get_table: function () {
        return this.$el.dataTable();
    },
    get_nodes: function (index) {
        return this.$el.fnGetNodes(index);
    },
    update: function (data, tr_or_index, col_index, redraw, predraw) {
        return this.get_table().fnUpdate(data, tr_or_index, col_index, redraw, predraw);
    },
    draw: function (re) {
        this.get_table().fnDraw(re);
    },
    get_data: function (index_or_node, index) {
        return this.get_table().fnGetData(index_or_node, index);
    },
    get_position: function (node) {
        return this.$el.fnGetPosition(node);
    },
    get_settings: function () {
        return this.$el.fnSettings();
    },
    get_search: function () {
        var result = '';
        var settings = this.get_settings();
        if (settings.oPreviousSearch && settings.oPreviousSearch.sSearch) {
            result = settings.oPreviousSearch.sSearch;
        }
        return result;
    },
    is_datatable: function () {
        return $.fn.DataTable.fnIsDataTable(this.get_dom_table());
    },
    reload: function (isStandingRedraw) {
        if (this.collection !== undefined) {
            this.collection.fetch();
        }
        else {
            if (isStandingRedraw) {
                this.$el.fnStandingRedraw();
            }
            else {
                this.$el.fnDraw();
            }
        }
    },
    destroy: function () {
        // Destroy the old table if it exists.
        var dom_element = this.get_dom_table();
        if (!dom_element) {
            log.error('dom element is null.');
            return;
        }
        var id = null;
        if (_.has(dom_element, 'id')) {
            id = dom_element.id;
        }
        if ($.fn.DataTable.fnIsDataTable(dom_element)) {
            log.debug("Destroying DataTable with id: " + id);
            var table = this.$el.dataTable();
            this.trigger('destroy', table);

            // Destroy the old table.
            table.fnDestroy(false);
            table.empty();
        }
        else {
            log.debug(_.sprintf('Element with id: %s is not of type DataTable, skipping...', id));
        }
    },
    render: function (params) {
        if (!this.el) {
            // Error
            alert('Error: Undefined "el" in TableView');
            return;
        }

        // Destroy the existing table if there is one.
        this.destroy();

        var that = this;

        // Construct the table settings.
        var settings = StrikeFinder.get_datatables_settings(this, this.options);
        // Apply any parameters passed to the settings.
        if (params) {
            if (params['server_params'] != null) {
                var server_params = params['server_params'];
                if (server_params) {
                    log.debug('Setting server params...');
                    settings['fnServerParams'] = function (aoData) {
                        _.each(Object.keys(server_params), function (key) {
                            log.debug(_.sprintf('Setting param %s and value %s', key, server_params[key]));
                            aoData.push({name: key, value: server_params[key]});
                        });
                    }
                }
            }
            else if (params['aaData'] != null) {
                settings['aaData'] = params['aaData'];
            }
        }

        if (this.collection) {
            // If a collection is defined then use the data from the collection.
            settings['aaData'] = this.collection.toJSON();
        }

        // Create the table.
        var table = this.$el.dataTable(settings);
        return this;
    },
    fetch: function (params) {
        if (this.collection) {
            this.collection.fetch(params);
        }
        else {
            this.render({
                'server_params': params
            });
        }
    },
    close: function () {
        this.destroy();
        this.remove();
    },
    update_row: function (row_search_key, row_search_value, row_update_key, row_update_value, row_column_index) {
        var view = this;
        var nodes = view.get_nodes();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            var data = view.get_data(i);
            if (row_search_value == data[row_search_key]) {
                // Found the relevant row.
                data[row_update_key] = row_update_value;
                var cols = $(node).children('td');
                // Update the tagname cell.
                $(cols[row_column_index]).html(row_update_value);
                break; // **EXIT**
            }
        }
    }
});

/**
 * View class for the a select item.
 */
StrikeFinder.SelectView = StrikeFinder.View.extend({
    initialize: function () {
        if (this.collection) {
            this.listenTo(this.collection, 'reset', this.render);
        }
    },
    events: {
        "change": "item_changed"
    },
    render: function () {
        var view = this;

        var id_field = this.options["id_field"];
        var value_field = this.options["value_field"];
        var selected = this.options['selected'];

        _.each(this.collection.models, function (model) {
            var id = model.attributes[id_field];
            var option = "<option id=\"" + id + "\"";

            if (_.indexOf(selected, id) != -1) {
                option += " selected=\"true\""
            }

            option += ">";
            option += model.attributes[value_field];
            option += "</option>";
            view.$el.append(option);
        });

        var width = this.options['width'];
        if (!width) {
            width = "100%";
        }

        this.$el.select2({
            width: width
        });

        // Fire a single change event after loading is complete.
        this.item_changed(null);

        return this;
    },
    get_selected: function () {
        // Loop through all the items and fire a change event.
        var isOptionId = (this.options["isOptionId"] == null);
        var values = [];
        this.$("option").each(function () {
            if ($(this).is(":selected")) {
                if (isOptionId) {
                    values.push($(this).attr("id"));
                }
                else {
                    values.push($(this).val());
                }
            }
        });
        return values;
    },
    item_changed: function (ev) {
        this.trigger("change", this.get_selected());
    }
});

StrikeFinder.SelectHostSearchView = StrikeFinder.View.extend({
    initialize: function (options) {
        this.render();
    },
    events: {
        "change": "item_changed",
        "select2-highlight": "item_selected"
    },
    render: function () {
        var view = this;
        var title = 'Search for a Host or IP';
        var min_input_length = view.options.min_input_length ? view.options.min_input_length : 5;
        var max_input_length = view.options.max_input_length ? view.options.max_input_length : 200;
        view.$el.select2({
            placeholder: title,
            minimumInputLength: min_input_length,
            maximumInputLength: max_input_length,
            id: function (o) {
                return o.hash;
            },
            ajax: {
                url: '/sf/api/hosts',
                dataType: 'json',
                quietMillis: 500,
                data: function (term, page) {
                    if (term.indexOf(' ') != -1 || term.indexOf(',') != -1) {
                        try {
                            term = parse_search_string(term);
                            var found_ip = false;
                            for (var i = 0; i < term.length; i++) {
                                var t = term[i];
                                if (t.indexOf('.') != -1) {
                                    found_ip = true;
                                }
                                else {
                                    if (found_ip) {
                                        StrikeFinder.display_warn('Mixing hostnames and IP address in the search is ' +
                                            'not supported.');
                                    }
                                }
                            }
                        }
                        catch (e) {
                            StrikeFinder.display_warn('Unable to parse search term: ' + term);
                        }
                    }

                    log.debug('Searching by term: ' + term);

                    return {
                        hosts: term
                    };
                },
                results: function (data, page) {
                    return {results: data};
                }
            },
            formatResult: view.format_item,
            formatSelection: view.format_item_selection,
            dropdownAutoWidth: true,
            dropdownCssClass: 'uac-bigdrop'
        });
    },
    format_item: function (item) {
        return _.template($("#host-condensed-template").html(), item);
    },
    format_item_selection: function (object, container) {
        return object.hash;
    },
    item_changed: function (ev) {
        this.trigger('change', ev.val);
    }
});

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

        options.iDisplayLength = 100;
        options.aoColumns = [
            {sTitle: "IOC Name", mData: "iocname"},
            {sTitle: "Hash", mData: "iocnamehash", bVisible: false},
            {sTitle: "Supp", mData: "suppressed", sWidth: '10%'},
            {sTitle: "Claimed", mData: "checkedoutexpressions", sWidth: '10%'},
            {sTitle: "Total", mData: "totalexpressions", bVisible: false},
            {sTitle: "Open", mData: "open", sWidth: '10%'},
            {sTitle: "In Progress", mData: "inprogress", sWidth: '10%'},
            {sTitle: "Closed", mData: "closed", sWidth: '10%'}
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
        options.sDom = "lftip";
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
        var data = $.extend({}, view.options);
        var items = view.collection.toJSON();
        data.items = items;

        log.debug('Rendering IOC details...');

        if (view.table_views) {
            _.each(view.table_views, function (table_view) {
                table_view.close();
            });
        }
        view.table_views = [];

        var on_ioc_click = function (ev) {
            view.trigger('click:iocnamehash');
        };

        // Remove any listeners bound to the IOC name.
        view.$('#ioc-details-item').off('click', on_ioc_click);
        // Render the template.
        var template = _.template($("#ioc-details-template").html(), data);
        view.$el.html(template);
        // Add a click listener to the IOC name.
        view.$('#ioc-details-item').on('click', on_ioc_click);

        // Register click items with the ioc uid table.
        _.each(items, function (item, index) {
            var table = new StrikeFinder.TableView({
                el: view.$("#uuid-" + index + "-table"),
                aaData: item.expressions,
                aoColumns: [
                    {sTitle: "exp_key", mData: "exp_key", bVisible: false},
                    {sTitle: "Expression", mData: "exp_string", sWidth: '50%'},
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
                        "aTargets": [3]
                    }
                ],
                oLanguage: {
                    sLoadingRecords: "<i class='icon-refresh icon-spin icon-large'></i> Loading..."
                }
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
    fetch: function (params) {
        this.collection.fetch({data: params});
    }
});

/**
 * View representing a row of the suppressions table view.
 */
StrikeFinder.SuppressionRowView = StrikeFinder.View.extend({
    events: {
        'click a.destroy': 'on_delete'
    },
    on_delete: function (ev) {
        var view = this;
        StrikeFinder.run(function () {
            var message = _.sprintf('Delete suppression: %s', view.model.get('formatted'));
            if (confirm(message)) {
                view.model.destroy({
                    success: function () {
                        view.trigger('delete', view.model);
                    }
                });
            }
        });
    },
    close: function () {
        log.debug('Closing row view...');
        this.remove();
    }
});

StrikeFinder.SuppressionsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        if (!view.collection) {
            view.collection = new StrikeFinder.SuppressionListItemCollection();
        }
        view.listenTo(view.collection, 'sync', view.render);

        var condensed = view.options['condensed'];

        // Add a collapsable container.
        view.suppressions_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            'title': '&nbsp;',
            title_class: 'uac-header',
            collapsed: condensed
        });
        view.collection.listenTo(view.collection, 'sync', function () {
            // Update the suppressions collapsable count whenever the data has changed.
            var title_template = '<i class="icon-level-down"></i> Active Suppressions (%d)';
            view.suppressions_collapsable.set('title', _.sprintf(title_template, view.collection.length));
        });

        if (condensed) {
            this.options['iDisplayLength'] = -1;

            view.options['sDom'] = 't';

            view.options['aoColumns'] = [
                {sTitle: "Suppression Id", mData: 'suppression_id', bVisible: false, bSortable: true},
                {sTitle: "Suppression", mData: 'formatted', bVisible: true, bSortable: true},
                {sTitle: "Global", mData: 'cluster_name', bVisible: true, bSortable: true},
                {sTitle: "Hits", mData: 'suppressed', bVisible: true, bSortable: true}
            ];

            view.options['aoColumnDefs'] = [
                {
                    // `data` refers to the data for the cell (defined by `mData`, which
                    // defaults to the column being worked with, in this case is the first
                    // Using `row[0]` is equivalent.
                    mRender: function (data, type, row) {
                        return '<a class="btn btn-link destroy" data-toggle="tooltip" ' +
                            'title="Delete Suppression" style="padding: 0px 0px"><i class="icon-remove-sign"></i></a> ' + data;
                    },
                    aTargets: [1]
                },
                {
                    mRender: function (data, type, row) {
                        if (!data) {
                            return 'Global';
                        }
                        else {
                            return data;
                        }
                    },
                    aTargets: [2]
                }
            ];

            view.options['aaSorting'] = [];
        }
        else {
            this.options['iDisplayLength'] = 10;

            view.options['sDom'] = 'Rlftip';

            view.options['aoColumns'] = [
                {sTitle: "Suppression Id", mData: 'suppression_id', bVisible: false, bSortable: true},
                {sTitle: "Name", mData: 'comment', sClass: 'nowrap', bSortable: true},
                {sTitle: "IOC", mData: 'iocname', bSortable: true},
                {sTitle: "IOC UID", mData: 'ioc_uid', bSortable: true},
                {sTitle: "Hits", mData: 'suppressed', bSortable: true},
                {sTitle: "Rule", mData: 'formatted', bSortable: true},
                {sTitle: "Global", mData: 'cluster_name', bVisible: true, bSortable: true},
                {sTitle: "Author", mData: 'user_uuid', bSortable: true},
                {sTitle: "Created", mData: 'created', bSortable: true}
            ];

            view.options['aoColumnDefs'] = [
                {
                    mRender: function (data, type, row) {
                        return '<a class="btn btn-link destroy" data-toggle="tooltip" ' +
                            'title="Delete Suppression" style="padding: 0px 0px"><i class="icon-remove-sign"></i></a> ' + data;
                    },
                    aTargets: [1]
                },
                {
                    mRender: function (data, type, row) {
                        if (!data) {
                            return 'Global';
                        }
                        else {
                            return data;
                        }
                    },
                    aTargets: [6]
                }
            ];

            view.options['aaSorting'] = [
                [ 0, "asc" ]
            ];
        }

        // Keep track of the row views.
        view.suppression_row_views = [];
        view.options['fnCreatedRow'] = function (nRow, aData, iDataIndex) {
            var suppression_row = new StrikeFinder.SuppressionRowView({
                el: $(nRow),
                model: view.collection.at(iDataIndex)
            });
            suppression_row.listenTo(suppression_row, 'delete', function () {
                var msg = _.sprintf('Successfully deleted suppression: %s', suppression_row.model.get('formatted'));
                StrikeFinder.display_success(msg);
                view.trigger('delete');
            });
            view.suppression_row_views.push(suppression_row);
        };

        view.listenTo(view, 'destroy', function () {
            // Clean up an existing suppressions row views any time the table is destroyed.
            if (view.suppression_row_views) {
                log.debug(_.sprintf('Cleaning up %d existing suppression row views...',
                    view.suppression_row_views.length));
                _.each(view.suppression_row_views, function (suppression_row) {
                    suppression_row.close();
                });
            }
            view.suppression_row_views = [];
        });
    },
    fetch: function (exp_key) {
        if (exp_key) {
            this.collection.exp_key = exp_key;
        }
        this.collection.fetch();
    }
});

/**
 * Hits table view.
 */
StrikeFinder.HitsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '<i class="icon-list"></i> Hits',
            title_class: 'uac-header',
            collapsed: true
        });

        view.options.sAjaxSource = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options.bServerSide = true;

        view.options.aoColumns = [
            {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: true},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
            {sTitle: "rowitem_type", mData: "rowitem_type", bVisible: false, bSortable: false},
            {sTitle: "Tag", mData: "tagname", sWidth: "10%", bSortable: false},
            {sTitle: "Summary", mData: "summary1", sWidth: "45%", bSortable: false},
            {sTitle: "Summary2", mData: "summary2", sWidth: "45%", bSortable: false}
        ];
        view.options.sDom = 'Rltip';
        view.options.iDisplayLength = 200;
        view.listenTo(view, 'load', function () {
            view.select_row(0)
        });
    }
});

/**
 * Hits table for a suppression.
 */
StrikeFinder.HitsSuppressionTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '<i class="icon-level-down"></i> Suppressed Hits',
            title_class: 'uac-header'
        });

        view.options['sAjaxSource'] = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options['bServerSide'] = true;

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: true},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
            {sTitle: "rowitem_type", mData: "rowitem_type", bVisible: false, bSortable: false},
            {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false},
            {sTitle: "Summary", mData: "summary1", bSortable: false},
            {sTitle: "Summary2", mData: "summary2", bSortable: false}
        ];

        view.options['sDom'] = 'Rltip';
        view.listenTo(view, 'load', function () {
            view.select_row(0)
        });
    },
    fetch: function (suppression_id) {
        if (!suppression_id) {
            log.error('"suppression_id" is undefined.');
            return;
        }
        this.render({server_params: {suppression_id: suppression_id}});
    }
});

/**
 * Agent host view.
 */
StrikeFinder.AgentHostView = StrikeFinder.View.extend({
    initialize: function (options) {
        var am_cert_hash = options['am_cert_hash'];
        if (!this.model) {
            var attr = {};
            if (options && options.am_cert_hash) {
                attr.id = options.am_cert_hash;
            }
            this.model = new StrikeFinder.AgentHostModel(attr);
        }
        this.listenTo(this.model, 'sync', this.render);
    },
    render: function () {
        var view = this;
        if (view.model.get("hash")) {
            // Display the host template.
            view.$el.html(_.template($("#agent-host-template").html(), view.model.toJSON()));
        }
        else {
            // The host was not found, display alternate message.
            var data = {am_cert_hash: view.model.id};
            view.$el.html(_.template($("#agent-host-empty-template").html(), data));
        }

        return view;
    },
    render_service_down: function() {
        var view = this;
        view.$el.html(_.template($("#agent-host-error-template").html(), {am_cert_hash: view.model.id}));
    },
    fetch: function (am_cert_hash) {
        var view = this;
        view.model.clear();
        if (am_cert_hash) {
            view.model.id = am_cert_hash;
        }
        view.model.fetch({
            error: function(model, response, options) {
                view.render_service_down();
            }
        });
    },
    attributes: function () {
        return this.model ? this.model.attributes : null;
    }
});

/**
 * Tabbed view of IOC's.
 */
StrikeFinder.IOCTabsView = StrikeFinder.View.extend({
    events: {
        'click .ioc-definition': 'on_click'
    },
    initialize: function (options) {
        this.el.title = 'Click to toggle filtering on and off.';

        if (!this.collection) {
            this.collection = new StrikeFinder.IOCCollection([], {
                rowitem_uuid: options.rowitem_uuid
            });
        }

        // Filter by default.
        this.filtered = true;

        this.listenTo(this.collection, 'sync', this.render);
    },
    render: function () {
        var view = this;

        var data = {
            items: view.collection.toJSON(),
            get_active_class: function (index) {
                if (index == 0) {
                    return "active";
                }
                else {
                    return "";
                }
            }
        };

        var html = _.template($("#ioc-tabs-template").html(), data);
        view.$el.html(html);

        // Run the IOC viewer.
        view.$("pre").iocViewer();

        // Filter by default.
        view.filter();

        return this;
    },
    /**
     * Filter the IOC viewer to only the relevant hits.
     */
    filter: function () {
        var view = this;

        // Iterator over the related IOC models and adjust the corresponding tab.
        _.each(view.collection.models, function (model, index, list) {
            var ioc_tab_selector = '#ioc-tab-' + index;
            var ioc_tab_element = view.$(ioc_tab_selector);

            // Hide the metadata.
            //ioc_tab_element.find('.ioc-metadata').hide();

            // Find the root IOC definition.
            var ioc_definition_list = ioc_tab_element.find('.ioc-definition');
            if (ioc_definition_list.length != 1) {
                log.error('Unable to find IOC definition.');
            }
            var ioc_definition_element = ioc_definition_list;
            ioc_definition_element.addClass('highlighted');

            // Hide the root IOC definitions children.
            ioc_definition_element.children().hide();

            // Get the highlighted items from the IOC's model.
            var selected_id_string = model.get('details');
            var selected_ids;
            if (selected_id_string.indexOf(',') != -1) {
                selected_ids = selected_id_string.split(',');
            }
            else {
                selected_ids = [selected_id_string];
            }

            var items_to_hide = [];

            // Iterate over the IOC's selected items.
            _.each(selected_ids, function (selected_id) {
                var selected_id_selector = '.ioc-guid-' + selected_id;
                var selected_element = ioc_definition_element.find(selected_id_selector);
                if (!selected_element) {
                    log.error('Unable to find selected element for selector: ' + selected_id_selector);
                }

                var selected_element_path = view.get_path(selected_element.get(0), ioc_definition_element.get(0));
                _.each(selected_element_path, function (selected_path_item) {
                    // Display the selected item.
                    view.$(selected_path_item).show();
                    // Mark the item as highlighted so it's not hidden.
                    view.$(selected_path_item).addClass('highlighted');

                    items_to_hide = jQuery.merge(items_to_hide, view.$(selected_path_item).siblings('ul li').not('.highlighted'));
                    items_to_hide = jQuery.merge(items_to_hide, view.$(selected_path_item).find('ul li').not('.highlighted'));
                });

                // Highlight the item.
                selected_element.find('> span.ioc-rule').css({'background': 'yellow', 'font-weight': 'bold'});

                // Debug, highlight the selected element's green.
                //$(selected_path_item).css('background', 'green');
            });

            // Hide any items not marked as highlighted.
            _.each(items_to_hide, function (i) {
                if (!view.$(i).hasClass('highlighted')) {
                    //view.$(i).css({'opacity': 0.3 });
                    view.$(i).addClass('uac-opaque');
                }
            });
        });
    },
    /**
     * Remove any IOC filtering.
     */
    unfilter: function () {
        var view = this;

        // Iterator over the related IOC models and adjust the corresponding tab.
        _.each(view.collection.models, function (model, index, list) {
            var ioc_tab_selector = '#ioc-tab-' + index;
            log.debug('ioc_tab_selection: ' + ioc_tab_selector);
            var ioc_tab_element = view.$(ioc_tab_selector);

            // Show the metadata.
            //ioc_tab_element.find('.ioc-metadata').show();

            // Find the root IOC definition.
            var ioc_definition_list = ioc_tab_element.find('.ioc-definition');
            if (ioc_definition_list.length != 1) {
                log.error('Unable to find IOC definition.');
            }
            // Display the children and remove any previous formatting.
            ioc_definition_list.children().show();
            ioc_definition_list.find('*').removeClass('uac-opaque').removeClass('highlighted');
        });
    },
    on_click: function () {
        var view = this;
        view.filtered = !view.filtered;
        if (view.filtered) {
            view.filter();
        }
        else {
            view.unfilter();
        }
    },
    /**
     * Get the path to the element from the parent.
     * @param element - the element whose path we are retrieving.
     * @param parent - find the path up to this element.
     * @returns {Array} of elements.
     */
    get_path: function (element, parent) {
        var view = this;
        var path = '';
        var results = [];
        for (; element != parent && element && element.nodeType == 1; element = element.parentNode) {
            var inner = view.$(element).children().length == 0 ? view.$(element).text() : '';
            results.push(element);
            var eleSelector = element.tagName.toLowerCase() +
                ((inner.length > 0) ? ':contains(\'' + inner + '\')' : '');
            path = ' ' + eleSelector + path;
        }
        // Debug, print the path.
        //log.debug('Path: ' + path);
        return results;
    },
    fetch: function (rowitem_uuid) {
        if (rowitem_uuid) {
            this.collection.rowitem_uuid = rowitem_uuid;
        }
        this.collection.fetch();
    }
});

/**
 * File/Info details view.
 */
StrikeFinder.FileInfoView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;

        if (options.rowitem_uuid) {
            view.rowitem_uuid = options.rowitem_uuid;
        }

        if (!view.model) {
            this.model = new StrikeFinder.FileInfoModel({
                id: view.rowitem_uuid
            });
        }
        this.listenTo(this.model, 'sync', this.render);
    },
    render: function () {
        var data = {
            html: _.unescape(this.model.get('content'))
        };

        var html = _.template($("#file-info-template").html(), data);
        this.$el.html(html);

        var that = this;

        var div_index = 1;

        var parent_sections = this.$('#file-info-content').children('div .xslt-contents');
        _.each(parent_sections, function (section) {
            that.$(section).attr('id', 'file-info-div' + div_index++);

            var title = that.$(section).attr('xslt-title');
            var collapsed = title && title == 'Portal Formatted Data';
            var collapse = new StrikeFinder.CollapsableContentView({
                el: that.$(section),
                title: title,
                title_class: 'uac-sub-header',
                collapsed: collapsed
            });
        });

        var child_sections = this.$('#file-info-content').find('div .xslt-contents-field');
        _.each(child_sections, function (section) {
            that.$(section).attr('id', 'file-info-div' + div_index++);
            var collapse = new StrikeFinder.CollapsableContentView({
                el: that.$(section),
                title: that.$(section).attr('xslt-title'),
                title_class: 'uac-sub-header',
                collapsed: true
            });
        });

        this.$(".collapsable-title").css('font-size', '13px');

        // Bold embedded header data.
        this.$("#file-info-content div .xslt-contents-header").css('font-weight', 'bold');

        // Style the embedded tables.
        this.$("#file-info-content table").addClass("table table-striped table-bordered table-hover table-condensed");
        // Style the embedded text areas.
        this.$("#file-info-content textarea").css("width", "95%").css("min-height", "100px");
        //this.$("#file-info-content ul").css("display", "none");

        // Style embedded list items to make them easier to read.
        this.$("#file-info-content li").css("font-weight", "bold").css("background-color", "#F8F8F8");
        this.$("#file-info-content li div").css("font-weight", "normal").css("font-size", "95%").css("padding-left", "25px");
        this.$("#file-info-content li .outline").css("background-color", "#FFFFFF");

        return this;
    },
    fetch: function (rowitem_uuid) {
        if (rowitem_uuid) {
            this.model.id = rowitem_uuid;
        }
        this.model.fetch();
    }
});

/**
 * View for displaying context menu in the File/Info view.
 */
StrikeFinder.FileInfoContextMenuView = StrikeFinder.View.extend({
    initialize: function () {
        this.render();
    },
    events: {
        "click #suppress-item": "suppress",
        "click #acquire-item": "acquire",
        "click #tag-item": "tag",
        "click #close-item": "cancel"
    },
    render: function () {
        var view = this;

        $(view.options.source).highlighter({
            selector: _.sprintf('#%s', view.el.id),
            complete: function (selection) {
                if (!_.isEmpty(selection)) {
                    selection = _.trim(selection);
                }
                view.selection = selection;
            }
        });

        var is_suppress = true;
        if ('suppress' in view.options && view.options['suppress'] === false) {
            is_suppress = false;
        }
        var is_acquire = true;
        if ('acquire' in view.options && view.options['acquire'] === false) {
            is_acquire = false;
        }
        var is_masstag = true;
        if ('masstag' in view.options && view.options['masstag'] === false) {
            is_masstag = false;
        }

        var data = {
            is_suppress: is_suppress,
            is_acquire: is_acquire,
            is_masstag: is_masstag
        };

        var template = _.template($("#file-info-context-menu-template").html(), data);
        view.$el.html(template);
    },
    suppress: function (ev) {
        this.trigger("suppress", this.selection);
        this.$el.hide();
    },
    acquire: function (ev) {
        this.trigger("acquire", this.selection);
        this.$el.hide();
    },
    tag: function (ev) {
        this.trigger('tag', this.selection);
        this.$el.hide();
    },
    cancel: function (ev) {
        this.$el.hide();
    }
});

StrikeFinder.MassTagFormView = StrikeFinder.View.extend({
    events: {
        "click #tag": "tag",
        "click #cancel": "cancel"
    },
    render: function (params) {
        var view = this;

        if (!params) {
            // Error, params are required.
            throw new Error('"params" is undefined.');
        }
        else if (!params.exp_key) {
            // Error, exp_key is required.
            throw new Error('"exp_key" is undefined.');
        }
        else if (!params.item_value) {
            // Error, item_value is required.
            throw new Error('"item_value" is undefined.');
        }
        else if (!params.rowitem_type) {
            // Error, rowitem_type is required.
            throw new Error('"rowitem_type" is undefined.');
        }
        else if (!params.cluster_uuid) {
            // Error, cluster_uuid is required.
            throw new Error('"cluster_uuid" is undefined.');
        }
        else if (!params.am_cert_hash) {
            // Error, am_cert_hash is required.
            throw new Error('"am_cert_hash" is undefined.')
        }

        // Create a new mass tag model.
        view.model = new StrikeFinder.MassTagModel({
            itemvalue: params.item_value,
            rowitem_type: params.rowitem_type,
            exp_key: params.exp_key,
            cluster_uuid: params.cluster_uuid,
            am_cert_hash: params.am_cert_hash
        });

        // Deep copy the model values.
        var data = this.model.toJSON();

        // Obtain the terms selection.
        var terms = new StrikeFinder.IOCTermsCollection([], {
            rowitem_type: this.model.get("rowitem_type")
        });
        terms.fetch({
            async: false
        });
        if (terms) {
            log.debug('Retrieved ' + terms.length + ' terms...');
            data.terms = terms.toJSON();
        }
        else {
            log.warning('Terms was invalid');
            data['terms'] = [];
        }

        data.tags = StrikeFinder.tags;

        // Retrieve the related IOC terms.
        var template = _.template($("#mass-tag-form-template").html(), data);
        this.$el.html(template);

        view.$("#mass-tag-form").modal({
            backdrop: false
        });
    },
    tag: function () {
        var view = this;
        var form = view.$('#mass-tag-form');

        try {
            // Immediately block to prevent multiple submissions.
            StrikeFinder.block(form);

            // Update the model with the form data.
            view.model.set('tagname', view.$("#tagname").val());
            view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
            view.model.set('condition', view.$("#condition").val());
            view.model.set('preservecase', view.$("#preservecase").is(":checked"));
            view.model.set('itemvalue', view.$("#itemvalue").val());
            view.model.set('comment', view.$('#comment').val());
            view.model.set('perform_updates', false);

            // Handle the scope.
            var scope = view.$('input:radio[name=scope]:checked').val();
            if (!scope) {
                // Validation error, this should not happen.
                StrikeFinder.display_error('"scope" is required.');
                return; // **EXIT**
            }
            if (scope == 'agent') {
                view.model.unset('cluster_uuid');
            }
            else if (scope == 'cluster') {
                view.model.unset('am_cert_hash');
            }
            else {
                // Error, bad scope value.
                StrikeFinder.display_error(_.sprintf('Invalid scope value (%s), defaulting to cluster.', scope));
            }

            // Validate the model before saving.
            if (!view.model.isValid()) {
                errors = view.model.validationError;
                _.each(errors, function (error) {
                    StrikeFinder.display_error(error);
                });
                return; // **EXIT**
            }

            view.model.save({}, {
                success: function (model, response, options) {
                    // Get the tag count.
                    var count = response.count;
                    log.debug(JSON.stringify(view.model.attributes));

                    if (count <= 0) {
                        // Nothing to tag.
                        alert('Your request didn\'t match any hits, try again.');
                        return // **EXIT**
                    }

                    if (window.confirm(_.sprintf('Mass tag %d items?', count))) {
                        // Tag the rows.
                        var newModel = new StrikeFinder.MassTagModel(view.model.attributes);
                        newModel.set('perform_updates', true);
                        newModel.save({}, {
                            success: function (model, response) {
                                // OK.
                                count = response.count;

                                view.$("#mass-tag-form").modal("hide");

                                // Notify that a tags were created.
                                view.trigger('create', newModel);

                                StrikeFinder.display_success(_.sprintf('Successfully tagged %d items.', count));
                            }
                        })
                    }
                }
            });
        }
        finally {
            StrikeFinder.unblock(form);
        }
    },
    cancel: function () {
        this.$("#mass-tag-form").modal("hide");
        // Notify that the dialog was canceled.
        this.trigger('cancel');
    }
});

/**
 * Form view for creating a suppression.
 */
StrikeFinder.SuppressionFormView = StrikeFinder.View.extend({
    events: {
        "click #suppress": "suppress",
        "click #cancel": "cancel"
    },
    render: function (params) {
        var view = this;

        var item_value = params.item_value;
        var rowitem_type = params.rowitem_type;
        var exp_key = params.exp_key;
        var cluster_uuid = params.cluster_uuid;

        if (!params) {
            // Error, params are required.
            throw new Error('"params" is undefined.');
        }
        else if (!params.exp_key) {
            // Error, exp_key is required.
            throw new Error('"exp_key" is undefined.');
        }
        else if (!params.item_value) {
            // Error, item_value is required.
            throw new Error('"item_value" is undefined.');
        }
        else if (!params.rowitem_type) {
            // Error, item_type is required.
            throw new Error('"rowitem_type" is undefined.');
        }
        else if (!params.cluster_uuid) {
            // Error, cluster_uuid is required.
            throw new Error('"cluster_uuid" is undefined.');
        }

        log.debug('Rendering suppression form view...');

        // Create a new suppression model and associated it with the form.
        view.model = new StrikeFinder.SuppressionModel({
            itemvalue: item_value,
            rowitem_type: rowitem_type,
            exp_key: exp_key,
            cluster_uuid: cluster_uuid
        });

        // Deep copy the model values.
        var data = this.model.toJSON();

        var terms = new StrikeFinder.IOCTermsCollection([], {
            rowitem_type: this.model.get("rowitem_type")
        });
        terms.fetch({
            async: false
        });

        if (terms) {
            log.debug('Retrieved ' + terms.length + ' terms...');
            data['terms'] = terms.toJSON();
        }
        else {
            log.warning('Terms was invalid');
            data['terms'] = [];
        }

        // Retrieve the related IOC terms.
        var template = _.template($("#suppression-form-template").html(), data);
        this.$el.html(template);

        view.$("#suppression-form").modal({
            backdrop: false
        });
    },
    suppress: function () {
        var view = this;
        StrikeFinder.run(function () {
            // Update the model.
            view.model.set('comment', view.$("#comment").val());
            view.model.set('condition', view.$("#condition").val());
            view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
            view.model.set('itemvalue', view.$("#itemvalue").val());
            //this.model.set('negate', this.$("#negate").val());
            view.model.set('preservecase', view.$("#preservecase").is(":checked"));

            // Check if the suppression is global.
            var is_global = view.$("#global").is(":checked");
            if (is_global) {
                // Remove the cluster_uuid from the model.
                view.model.unset('cluster_uuid');
            }

            // Validate the model before saving.
            if (!view.model.isValid()) {
                errors = view.model.validationError;
                _.each(errors, function (error) {
                    StrikeFinder.display_error(error);
                });
                return; // **EXIT**
            }

            view.$("#suppression-form").modal("hide");

            view.model.save({}, {
                success: function (model, response, options) {
                    // Get te suppression count.
                    var count = response['count'];

                    log.debug(JSON.stringify(view.model.attributes));

                    var msg = _.sprintf('Successfully suppressed %d items for %s', count, view.model.as_string());
                    StrikeFinder.display_success(msg);

                    // Notify that a suppression was created.
                    view.trigger('create', view.model);
                }
            });
        });
    },
    cancel: function () {
        this.$("#suppression-form").modal("hide");
        // Notify that the dialog was canceled.
        this.trigger('cancel');
    }
});

StrikeFinder.AcquireFormView = StrikeFinder.View.extend({
    events: {
        "click #acquire": "acquire",
        "click #cancel": "cancel"
    },
    render: function (params) {
        var view = this;

        log.debug('Rendering acquire form view...');
        log.debug('params: ' + JSON.stringify(params));

        if (!params) {
            // Error, params are required.
            throw new Error('"params" is undefined.');
        }
        else if (!params.am_cert_hash) {
            // Error, am_cert_hash is required.
            throw new Error('"am_cert_hash" is undefined.');
        }
        else if (!params.rowitem_uuid) {
            // Error, rowitem_uuid is required.
            throw new Error('"rowitem_uuid" is undefined.');
        }
        else if (!params.cluster_uuid) {
            // Error, cluster_uuid is required.
            throw new Error('"cluster_uuid" is undefined.');
        }

        var selection = params['selection'];
        var file_path = '%systemroot%\\system32';
        var file_name = '';
        if (selection) {
            // Parse out the path and name of the file.
            selection = _.strip(selection);

            var parts = selection.split("\\");

            if (parts.length <= 1) {
                file_name = parts.pop();
            }
            else {
                file_name = parts.pop();
                file_path = parts.join("\\");
            }
        }
        else {
            // Error
            StrikeFinder.error('Nothing selected.');
            return;
        }

        // Create a new model for the acquisition data.
        view.model = new StrikeFinder.AcquireModel({
            am_cert_hash: params.am_cert_hash,
            cluster_uuid: params.cluster_uuid,
            cluster_name: params.cluster_name,
            rowitem_uuid: params.rowitem_uuid
        });

        var data = this.model.toJSON();
        data['file_path'] = file_path;
        data['file_name'] = file_name;

        // Display the acquire template.
        var template = _.template($("#acquire-form-template").html(), data);
        this.$el.html(template);

        // Display the form to the user.
        view.$('#acquire-form').modal({
            backdrop: false
        });
    },
    acquire: function () {
        var view = this;
        var acquire_form = view.$('#acquire-form');

        try {
            // Immediately block to prevent multiple submissions.
            StrikeFinder.block(acquire_form);

            view.model.set('file_path', view.$('#file_path').val());
            view.model.set('file_name', view.$('#file_name').val());
            view.model.set('method', view.$('#method').val());
            view.model.set('comment', view.$('#comment').val());
            view.model.set('user', view.$('#user').val());
            view.model.set('password', view.$('#password').val());
            view.model.set('force', view.$("#force").is(":checked"));

            if (!view.model.isValid()) {
                var errors = view.model.validationError;
                _.each(errors, function (error) {
                    StrikeFinder.display_error(error);
                });

                return; // **EXIT**
            }
        }
        finally {
            // Unblock before starting the AJAX call.
            StrikeFinder.unblock(acquire_form);
        }

        // Block the dialog during the AJAX call.
        var unblock = function () {
            StrikeFinder.unblock(acquire_form);
        };
        StrikeFinder.block_ajax(acquire_form, unblock, 'Processing...');

        view.model.save({}, {
            success: function (model, response, options) {

                // Sample response.
                //{"uuid": "...",
                // "file_name": "rasauto.dll",
                // "controller": "...",
                // "agent": hash?,
                // "file_path": "C:\\Windows\\System32",
                // "cluster": "...",
                // "state": "submitted",
                // "ref": "/api/v1/acquisitio...",
                // "method": "api"}

                if (!response) {
                    StrikeFinder.error('Invalid response from server while submitting acquisition.');
                    return; // **EXIT**
                }
                else if (response.state != 'submitted') {
                    StrikeFinder.display_error(_.sprintf('Bad state (%s) while submitting acquisition.',
                        response.state));
                    StrikeFinder.display_error(response['error_message']);
                    return; // **EXIT**
                }

                // Hide the dialog.
                view.$(acquire_form).modal('hide');

                StrikeFinder.display_success('Acquisition submitted successfully.');

                // Notify that a suppression was created.
                view.trigger('create', view.model);
            },
            error: function (model, xhr, options) {
                StrikeFinder.display_error('Error submitting acquisition request.');
            }
        });
    },
    /**
     * Cancel the acquire form dialog.
     */
    cancel: function () {
        this.$("#acquire-form").modal("hide");
        // Notify that the dialog was canceled.
        this.trigger('cancel');
    }
});

/**
 * View to display and create comments.
 */
StrikeFinder.CommentsView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;
        if (options.rowitem_uuid) {
            this.rowitem_uuid = options.rowitem_uuid;
        }

        view.comments_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '<i class="icon-comments"></i> Comments',
            title_class: 'uac-header'
        });

        if (!view.collection) {
            view.collection = new StrikeFinder.CommentsCollection([], {
                rowitem_uuid: view.rowitem_uuid
            });
        }
        view.listenTo(this.collection, 'sync', this.render);
    },
    events: {
        "click button": "add_comment",
        "keyup #comment": "on_keyup"
    },
    render: function () {
        var view = this;

        this.run_once('init_views', function () {
            var html = _.template($("#comments-template").html());
            view.$el.html(html);

            view.comments_table = new StrikeFinder.TableView({
                el: view.$("#comments-table"),
                collection: view.collection,
                iDisplayLength: -1,
                aoColumns: [
                    {sTitle: "Created", mData: "created", sWidth: "20%", bSortable: true},
                    {sTitle: "Comment", mData: "comment", sWidth: "60%", bSortable: true},
                    {sTitle: "User", mData: "user_uuid", sWidth: "20%", bSortable: true}
                ],
                aaSorting: [
                    [ 0, "desc" ]
                ]
            });
            view.comments_table.render();
        });

        return this;
    },
    fetch: function (rowitem_uuid) {
        if (rowitem_uuid) {
            this.collection.rowitem_uuid = rowitem_uuid;
        }
        this.collection.fetch();
    },
    hide: function () {
        // Hide the collapsable decorator.
        this.comments_collapsable.hide();
    },
    show: function () {
        // Show the collapsable decorator.
        this.comments_collapsable.show();
    },
    add_comment: function () {
        var view = this;
        StrikeFinder.run(function () {
            var comment = view.$("#comment").val();
            if (!comment || comment.trim() == "") {
                log.warn('No comment value found.');
                return;
            }

            var rowitem_uuid = view.collection.rowitem_uuid;
            log.debug("Creating comment for rowitem_uuid: " + rowitem_uuid);

            var new_comment = new StrikeFinder.CommentsModel({
                comment: comment,
                rowitem_uuid: rowitem_uuid
            });

            log.debug('Comment rowitem_uuid: ' + new_comment.get('rowitem_uuid'))

            new_comment.save([], {
                async: false,
                success: function (model, response, options) {
                    $("#comment").val("");
                    view.collection.fetch();
                }
            });
        });
    },
    on_keyup: function (ev) {
        if (ev.keyCode == '13') {
            this.add_comment();
        }
    }
});

/**
 * View for rendering a selectable list of tags values.
 */
StrikeFinder.TagView = StrikeFinder.View.extend({
    initialize: function (options) {
        if (options.rowitem_uuid) {
            this.rowitem_uuid = options.rowitem_uuid;
        }
        if (!this.collection) {
            this.collection = new StrikeFinder.TagCollection();
        }
        this.listenTo(this.collection, 'reset', this.render);
    },
    events: {
        'click li > a': 'on_click'
    },
    render: function () {
        var data = {
            title: 'Tag',
            icon: 'icon-tag',
            get_description: function (item) {
                if ($(item).is('[description]')) {
                    return item['description'];
                }
                else {
                    return '';
                }
            },
            options: this.collection.toJSON()
        };
        var html = _.template($("#drop-down-template").html(), data);
        this.$el.html(html);

        return this;
    },
    on_click: function (ev) {
        var view = this;
        StrikeFinder.run(function () {
            var tagname = $(ev.currentTarget).attr('name');

            log.debug(_.sprintf('Setting tag: %s on rowitem_uuid: %s', tagname, view.rowitem_uuid));

            var tag_model = new StrikeFinder.SetTagModel({
                rowitem_uuid: view.rowitem_uuid,
                tagname: tagname
            });
            tag_model.save({}, {
                async: false,
                success: function () {
                    log.debug(_.sprintf('Applied tag: %s to rowitem_uuid: %s', tagname, view.rowitem_uuid));

                    StrikeFinder.display_success('Successfully applied tag: ' + tagname);
                    view.trigger('create', view.rowitem_uuid, tagname);
                }
            });
        });
    },
    fetch: function (rowitem_uuid) {
        if (rowitem_uuid) {
            // Don't actually re-fetch the tags but update the row id.
            this.rowitem_uuid = rowitem_uuid;
        }
    }
});

/**
 * The main shopping view.
 */
StrikeFinder.ShoppingView = Backbone.View.extend({
    initialize: function () {
        // ShoppingView reference.
        var view = this;

        // Determine the mode.
        if ('standalone' in view.options && !view.options['standalone']) {
            view.standalone = false;

            // Add a collapsable around the shopping view.
            view.shopping_collapsable = new StrikeFinder.CollapsableContentView({
                el: '#' + view.el.id,
                title: '<i class="icon-search"></i> IOC Shopping Criteria',
                title_class: 'uac-header'
            });
        }
        else {
            view.standalone = true;
        }

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
        view.listenTo(view.ioc_summaries_view, 'load', function () {
            var iocnamehash = view.model.get('iocnamehash');
            if (iocnamehash) {
                $('.' + iocnamehash).click();
            }
        });

        // Initialize the IOC details view.
        view.ioc_details_view = new StrikeFinder.IOCDetailsView({
            el: "#ioc-details-div"
        });
        view.listenTo(view.ioc_details_view, "click:exp_key", function (exp_key) {
            StrikeFinder.run(function () {
                // User chosen to view hits for an expression.
                log.debug("Selected exp_key: " + exp_key);

                view.model.set("exp_key", exp_key);

                if (view.standalone) {
                    // Running in stand-alone mode, navigate to the hits page.
                    var url = "/sf/hits" +
                        "#services/" + view.model.get("services") +
                        "/clusters/" + view.model.get("clusters") +
                        "/exp_key/" + view.model.get("exp_key");
                    if (view.model.get("checkout")) {
                        // Check out the expression and obtain the user token.
                        url += '/checkout/true';
                    }
                    window.location = url;
                }
                else {
                    // Render the hits view in-line within the current page.
                    if (!view.hits_view) {
                        view.hits_view = new StrikeFinder.HitsView({
                            el: '#hits-view-div'
                        });
                    }

                    var params = {
                        services: view.model.get('services'),
                        clusters: view.model.get('clusters'),
                        exp_key: view.model.get('exp_key'),
                        checkout: view.model.get('checkout')
                    };
                    view.hits_view.render(params);

                    if (view.shopping_collapsable) {
                        view.shopping_collapsable.toggle();
                    }

                    view.hits_view.show();
                }
            });
        });
        view.listenTo(view.ioc_details_view, "click:iocnamehash", function () {
            StrikeFinder.run(function () {
                // User has chosen to view hits for the entire IOC.
                log.debug(_.sprintf('Viewing hits for iocnamehash: %s', view.model.get('iocnamehash')));

                if (view.standalone) {
                    // Running in stand-alone mode, navigate to the hits page.
                    var url = "/sf/hits" +
                        "#services/" + view.model.get("services") +
                        "/clusters/" + view.model.get("clusters") +
                        "/iocnamehash/" + view.model.get("iocnamehash");
                    if (view.model.get("checkout")) {
                        // Check out the expression and obtain the user token.
                        url += '/checkout/true';
                    }
                    window.location = url;
                }
                else {
                    // Render the hits view in-line within the current page.
                    if (!view.hits_view) {
                        view.hits_view = new StrikeFinder.HitsView({
                            el: '#hits-view-div'
                        });
                    }
                    var params = {
                        services: view.model.get('services'),
                        clusters: view.model.get('clusters'),
                        exp_key: view.model.get('exp_key')[0],
                        checkout: view.model.get('checkout')
                    };
                    view.hits_view.render(params);

                    if (view.shopping_collapsable) {
                        view.shopping_collapsable.toggle();
                    }

                    view.hits_view.show();
                }
            });
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
    render_summaries: function () {
        var view = this;
        StrikeFinder.run(function () {
            view.ioc_details_view.hide();
            if (view.model.is_required_params_set()) {
                $('#ioc-summary-div').fadeIn().show();
                var params = {
                    services: view.model.get('services'),
                    clusters: view.model.get('clusters')
                };
                view.ioc_summaries_view.fetch({
                    data: params
                });
            }
            else {
                $("#ioc-summary-div").fadeOut().hide();
            }
        });
    },
    render_details: function () {
        var view = this;
        StrikeFinder.run(function () {
            if (view.model.is_required_params_set()) {
                view.ioc_details_view.show();
                view.ioc_details_view.options['legend'] = view.model.get('iocname');
                var params = {
                    services: view.model.get('services'),
                    clusters: view.model.get('clusters'),
                    iocnamehash: view.model.get('iocnamehash')
                };
                view.ioc_details_view.fetch(params);
                window.location = '#top';
            }
        });
    }
});

/**
 * View for the hits screen.
 */
StrikeFinder.HitsView = StrikeFinder.View.extend({
    render: function (options) {
        var view = this;

        log.debug(_.sprintf('Rendering hits view with params: %s', JSON.stringify(options)));

        var services = options.services;
        var clusters = options.clusters;
        var iocnamehash = options.iocnamehash;
        var exp_key = options.exp_key;
        var checkout = options.checkout;

        view.init_criteria(services, clusters, iocnamehash, exp_key, checkout, function () {
            // TODO: Remove the dependency on the criteria object.

            view.run_once('init_views', function () {
                // Suppressions.
                view.suppressions_table = new StrikeFinder.SuppressionsTableView({
                    el: '#suppressions-table',
                    condensed: true
                });
                view.listenTo(view.suppressions_table, 'delete', view.fetch);

                // Hits.
                view.hits_table_view = new StrikeFinder.HitsTableView({
                    el: '#hits-table'
                });

                // Initialize the hits details view.
                view.hits_details_view = new StrikeFinder.HitsDetailsView({
                    hits_table_view: view.hits_table_view,
                    exp_key: view.criteria.get('exp_key')[0]
                });
                view.listenTo(view.hits_details_view, 'create:tag', function (row, tagname) {
                    // A new tag has been created, loop through the table nodes and manually update the tagname
                    // for the relevant row.  This is a shortcut rather than re-loading the entire table.
                    view.hits_table_view.update_row('uuid', row.uuid, 'tagname', tagname, 0);
                    // Refresh the comments.
                    view.hits_details_view.fetch();
                });
                view.listenTo(view.hits_details_view, 'create:acquire', function (row, model) {
                    // An aquisition has been created, update the row's tag value.
                    view.hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 0);
                    // Refresh the comments.
                    view.hits_details_view.fetch();
                });
                view.listenTo(view.hits_details_view, 'create:suppression', function () {
                    view.fetch();
                });
                view.listenTo(view.hits_details_view, 'create:masstag', function () {
                    view.fetch();
                });
            });

            view.fetch();
        });
    },
    fetch: function () {
        var view = this;
        StrikeFinder.run(function () {
            // Refresh the hits view.
            view.suppressions_table.fetch(view.criteria.get('exp_key')[0]);
            view.hits_table_view.fetch(view.criteria.get_params());
        })
    },
    init_criteria: function (services, clusters, iocnamehash, exp_key, checkout, callback) {
        var view = this;
        if (services && clusters) {
            // Criteria has been supplied to the view.
            if (iocnamehash) {
                view.criteria = new StrikeFinder.UserCriteriaModel({
                    "services": services,
                    "clusters": clusters,
                    iocnamehash: iocnamehash
                });
            }
            else if (exp_key) {
                view.criteria = new StrikeFinder.UserCriteriaModel({
                    "services": services,
                    "clusters": clusters,
                    exp_key: exp_key
                });
            }
            else {
                // Error
                StrikeFinder.display_error('Expecting an IOC name hash or expression key.');
            }

            if (checkout) {
                // Option was specified to check out the hits, create a user token.
                log.debug('Checking out hits with data: ' + JSON.stringify(view.criteria.attributes));
                view.criteria.save({}, {
                    async: false,
                    success: function (model, response, options) {
                        log.debug('Created user token: ' + response['usertoken']);
                        callback();
                    },
                    error: function (model, xhr, options) {
                        StrikeFinder.display_error("Exception while processing checkout of hits.");
                        console.dir(model);
                    }
                });
            }
        }
        else {
            // No parameters sent, try and lookup existing user token data.
            log.debug('No parameters sent, attempting to load user token data...');
            view.criteria = new StrikeFinder.UserCriteriaModel();
            view.criteria.fetch({async: false});

            log.debug('Loaded user criteria: ' + JSON.stringify(this.criteria.attributes));

            if (view.criteria.get('usertoken') ||
                (view.criteria.get('services') && view.criteria.get('clusters') && view.criteria.get('exp_key')) ||
                (view.criteria.get('services') && view.criteria.get('clusters') && view.criteria.get('namehash'))) {
                // Call the handler.
                callback();
            }
            else {
                // Error, unable to load view.  Navigate to the default page.
                window.location = '/sf/';
                return false;
            }
        }
    }
});

/**
 * Hits table view for display on the host view.
 * @type {*}
 */
StrikeFinder.HostHitsTableView = StrikeFinder.TableView.extend({
    initialize: function (options) {
        var view = this;

        view.collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '<i class="icon-list"></i> Hits',
            title_class: 'uac-header'
        });

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false},
            {sTitle: "Tag", mData: "tagname", bVisible: true},
            {sTitle: "IOC UUID", mData: "ioc_uid"},
            {sTitle: "IOC Name", mData: "iocname"},
            {sTitle: "Expression String", mData: "exp_string"},
            {sTitle: "Summary", mData: "summary1"},
            {sTitle: "Summary2", mData: "summary2"},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false}
        ];
        view.options['aaSorting'] = [];

        view.options['sDom'] = "Rlftip";

        if (!this.collection) {
            view.collection = new StrikeFinder.HitsCollection();
        }
        view.listenTo(view.collection, 'sync', view.render);
    },
    fetch: function (am_cert_hash) {
        this.collection.am_cert_hash = am_cert_hash;
        StrikeFinder.blockui_ajax();
        this.collection.fetch();
    }
});

/**
 * Generic view that includes a hits table, the IOC view, file details, and comments.
 *
 * options:
 *      hits-table-view - the hits table to attach this view to.
 *      tag             - whether to display the tag view.
 *      suppress        - whether to display the suppression form.
 *      masstag         - whether to display the mass tag form.
 *      acquire         - whether to display the acquire form.
 * @type {*}
 */
StrikeFinder.HitsDetailsView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;

        if (!options.hits_table_view) {
            // Error, hits_table_view is required.
            throw new Error('"hits_table_view" parameter is empty.');
        }

        // Initialize the hits table.
        view.hits_table_view = options.hits_table_view;
        // Render the details when a hit is selected.
        view.listenTo(view.hits_table_view, 'click', view.render_details);

        // Hide all of the details views when the hits table is empty.
        view.listenTo(view.hits_table_view, 'empty', function () {
            // Hide all components with the details view class.
            $('.sf-details-view').fadeOut().hide();
        });
    },
    /**
     * The user has selected a hit, render the details of that hit.
     * @param data - the hit data.
     */
    render_details: function (data) {
        var view = this;
        // Capture the current row on the view instance.
        view.row = data;

        StrikeFinder.run(function () {
            log.debug('Hits row selected: ' + JSON.stringify(data));

            view.run_once('init_details', function () {
                if (view.el.id) { // TODO: This shouldn't need to check the id, check the el instead.
                    // If an element is defined then write out the default details template.
                    view.$el.html(_.template($('#hits-details-template').html()));
                }

                //
                // Initialize the details components.

                // Prev/next controls.
                view.prev_next_view = new StrikeFinder.TableViewControls({
                    el: '#prev-next-div',
                    table: view.hits_table_view
                });
                view.prev_next_view.render();

                // Agent host view.
                view.agenthost_view = new StrikeFinder.AgentHostView({
                    el: '#agent-host-div'
                });

                // IOC tabs view.
                view.ioc_tabs_view = new StrikeFinder.IOCTabsView({
                    el: '#iocs-div'
                });

                // File info view.
                view.file_info_view = new StrikeFinder.FileInfoView({
                    el: $("#file-info-div")
                });

                // Suppression form.
                view.suppression_form_view = new StrikeFinder.SuppressionFormView({
                    el: $("#dialog-div")
                });
                view.listenTo(view.suppression_form_view, 'create', function (model) {
                    view.trigger('create:suppression', view.row, model);
                });

                // Acquire form.
                view.acquire_form_view = new StrikeFinder.AcquireFormView({
                    el: '#dialog-div'
                });
                view.listenTo(view.acquire_form_view, 'create', function (model) {
                    // After an acquisition the row tag should be investigating.
                    view.trigger('create:acquire', view.row, model);
                });

                // Mass tag form.
                view.mass_tag_form = new StrikeFinder.MassTagFormView({
                    el: '#dialog-div'
                });
                view.listenTo(view.mass_tag_form, 'create', function (model) {
                    view.trigger('create:masstag', view.row, model);
                });

                // Context menu.
                view.context_menu = new StrikeFinder.FileInfoContextMenuView({
                    el: $("#context-menu-div"),
                    source: "#file-info-div",
                    suppress: view.options.suppress,
                    acquire: view.options.acquire,
                    masstag: view.options.masstag
                });
                view.listenTo(view.context_menu, 'suppress', function (selection) {
                    log.debug(_.sprintf('Creating suppression for text: %s and rowitem_type: %s',
                        selection, data.rowitem_type));

                    // Display the suppression form.
                    view.suppression_form_view.render({
                        item_value: selection,
                        rowitem_type: view.row.rowitem_type,
                        exp_key: view.options.exp_key,
                        cluster_uuid: view.row.cluster_uuid
                    });
                });
                view.listenTo(view.context_menu, 'acquire', function (selection) {
                    var agent_host_data = view.agenthost_view.attributes();
                    var ss_cluster_uuid = null;
                    if (agent_host_data && agent_host_data.cluster && agent_host_data.cluster.uuid) {
                        ss_cluster_uuid = agent_host_data.cluster.uuid;
                    }

                    if (ss_cluster_uuid) {
                        view.acquire_form_view.render({
                            selection: selection,
                            am_cert_hash: view.row.am_cert_hash,
                            cluster_uuid: ss_cluster_uuid,
                            cluster_name: view.row.cluster_name,
                            rowitem_uuid: view.row.uuid
                        });
                    }
                    else {
                        // Error
                        StrikeFinder.display_error('Unable to submit acquisition, check Seasick status.');
                    }
                });
                view.listenTo(view.context_menu, 'tag', function (selection) {
                    var agent_host_data = view.agenthost_view.attributes();
                    view.mass_tag_form.render({
                        item_value: selection,
                        exp_key: view.options.exp_key,
                        am_cert_hash: view.row.am_cert_hash,
                        cluster_uuid: view.row.cluster_uuid,
                        rowitem_uuid: view.row.rowitem_uuid,
                        rowitem_type: view.row.rowitem_type
                    });
                });

                // Comments view.
                view.comments_view = new StrikeFinder.CommentsView({
                    el: '#comments-div'
                });

                if (!'tag' in view.options || view.options.tag !== false) {
                    // Display the tags view unless explicitly disabled.
                    view.tags = new StrikeFinder.TagCollection();
                    view.tags_view = new StrikeFinder.TagView({
                        el: '#tags-div',
                        collection: view.tags
                    });
                    view.tags.reset(StrikeFinder.tags);
                    view.listenTo(view.tags_view, 'create', function (rowitem_uuid, tagname) {
                        // Trigger an event when a new tag has been created.
                        view.trigger('create:tag', view.row, tagname);
                    });
                }
            });

            view.fetch();
        });
    },
    fetch: function () {
        var view = this;

        // Update the child views with the current row's parameters.
        view.agenthost_view.fetch(view.row.am_cert_hash);
        view.ioc_tabs_view.fetch(view.row.uuid);
        view.file_info_view.fetch(view.row.uuid);
        view.comments_view.fetch(view.row.uuid);
        if (view.tags_view) {
            // There are cases where the tags_view is not create/enabled.
            view.tags_view.fetch(view.row.uuid);
        }

        $('.sf-details-view').fadeIn().show();
    }
});

/**
 * StrikeFinder view class for displaying a hosts extended details.
 * @type {*}
 */
StrikeFinder.HostView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;

        var am_cert_hash = options['am_cert_hash'];
        if (!view.model) {
            var attr = {};
            if (options && options.am_cert_hash) {
                attr.id = options.am_cert_hash;
            }
            view.model = new StrikeFinder.AgentHostModel(attr);
        }
        view.listenTo(this.model, 'sync', this.render);

        view.collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '',
            title_class: 'uac-header'
        });
    },
    render: function () {
        var view = this;

        var data = this.model.toJSON();

        // Update the collapsable title.
        var title = data.cluster.engagement.client.name + ' : ' + data.domain + ' / ' + data.hostname;
        view.collapsable.set('title', '<i class="icon-desktop"></i> ' + title);
        // Render the template.
        view.$el.html(_.template($('#host-template').html(), data));
    },
    fetch: function (am_cert_hash) {
        if (am_cert_hash) {
            this.model.id = am_cert_hash;
        }
        this.model.fetch();
    }
});

