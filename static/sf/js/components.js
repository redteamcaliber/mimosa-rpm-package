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
            view.do_render.apply(view, args);
        }
        return view;
    },
    /**
     * Return the list of event listerners.
     * @returns {*}
     */
    get_listeners: function () {
        return this._listeners ? _.values(this._listeners) : [];
    }
});

/**
 * Wrap an element with a collapsable view.
 */
StrikeFinder.CollapsableContentView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;
        if (options.name) {
            view.name = options.name;
        }
        else if (view.el && view.el.id) {
            view.name = view.el.id;
        }
        else {
            log.error('"name" or "el.id" is required for collapsable.');
        }
        view.collapsed = options['collapsed'] || $(view.el).hasClass('collapsed');
        if (options.title) {
            view.title = options['title'];
        }
        else {
            view.title = '&nbsp;';
        }

        this.title_class = options['title_class'];

        this.display_toggle = options.display_toggle !== false;

        this.render();
    },
    render: function () {
        var view = this;

        view.run_once('init_render', function () {
            // Create the accordion inner div.
            var panel_body = $(document.createElement('div'));
            panel_body.addClass('panel-body');
            view.$el.wrap(panel_body);
            panel_body = view.$el.parent();

            // Create the accordion body.
            var panel_collapse = $(document.createElement('div'));
            panel_collapse.attr('id', 'collapse-' + view.name);
            panel_collapse.addClass('panel-collapse');
            panel_collapse.addClass('collapse');
            if (!view.collapsed) {
                panel_collapse.addClass('in');
            }
            panel_body.wrap(panel_collapse);
            panel_collapse = panel_body.parent();

            // Create the accordion group div.
            var panel = $(document.createElement('div'));
            panel.addClass('panel');
            panel.addClass('panel-default');
            panel.css('margin-bottom', '10px');
            panel_collapse.wrap(panel);
            panel = panel_collapse.parent();

            // Create the accordion div.
            var panel_group = $(document.createElement('div'));
            panel_group.attr('id', view.name + '-accordion');
            panel_group.addClass('panel-group');
            panel.wrap(panel_group);

            // Create the title.
            var title_span = $(document.createElement('span'));
            title_span.attr('id', view.name + '-title');
            if (view.title_class) {
                title_span.addClass(view.title_class);
            }
            if (view.title) {
                title_span.html(view.title);
            }

            if (view.display_toggle) {
                // Create the icon.
                var icon = $(document.createElement('i'));
                icon.addClass('fa fa-chevron-circle-down');
                icon.addClass('fa-lg');
                icon.addClass('pull-right');
            }

            // Create the accordion anchor.
            var anchor = $(document.createElement('a'));
            anchor.addClass('accordion-toggle');
            anchor.attr('data-toggle', 'collapse');
            anchor.attr('data-parent', view.name + '-accordion');
            anchor.attr('href', '#collapse-' + view.name);
            anchor.attr('title', 'Click to Expand or Collapse');
            anchor.css('text-decoration', 'none');

            anchor.append(title_span);
            anchor.append(icon);

            // Create the panel header.
            var panel_title = $(document.createElement('h4'));
            panel_title.addClass('panel-title');
            panel_title.append(anchor);

            // Create the accordion heading div.
            var panel_heading = $(document.createElement('div'));
            panel_heading.addClass('panel-heading');
            panel_heading.append(panel_title);

            panel.prepend(panel_heading);
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

            $(document).keyup(function (ev) {
                if (ev.ctrlKey) {
                    if (ev.keyCode == 68 || ev.keyCode == 40) {
                        view.on_next();
                    }
                    else if (ev.keyCode == 85 || ev.keyCode == 38) {
                        view.on_prev();
                    }
                }
            });
        });

        if (view.table !== undefined) {
            if (view.table.is_prev() || view.table.is_prev_page()) {
                view.$('a.prev').removeAttr('disabled');
            }
            else {
                view.$('a.prev').attr('disabled', true);
            }

            if (view.table.is_next() || view.table.is_next_page()) {
                // Enable the next record link.
                view.$('a.next').removeAttr('disabled');
            }
            else {
                // Disable the next record link.
                view.$('a.next').attr('disabled', true);
            }
        }
    },
    on_prev: function () {
        if (this.table !== undefined) {
            if (this.table.is_prev()) {
                this.table.prev();
            }
            else if (this.table.is_prev_page()) {
                this.table.prev_page();
            }
        }
    },
    on_next: function () {
        if (this.table !== undefined) {
            if (this.table.is_next()) {
                this.table.next();
            }
            else if (this.table.is_next_page()) {
                this.table.next_page();
            }
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
        asStripeClasses: [],
        fnRowCallback: function (nRow, data, iDisplayIndex, iDisplayIndexFull) {
            var click_handler = function (ev) {
                // Select the row.
                $(nRow).addClass('active').siblings().removeClass('active');
                // Trigger a click event.
                parent.trigger('click', parent.get_data(ev.currentTarget), ev);
            };

            // Remove any existing click events for the row.
            $(nRow).unbind('click', click_handler);
            // Bind a click event to the row.
            $(nRow).bind('click', click_handler);

            return nRow;
        },
        fnCreatedRow: function (nRow, data, iDataIndex) {
            parent.trigger('row:created', nRow, data, iDataIndex);
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
    initialize: function (options) {
        if (this.collection) {
            this.listenTo(this.collection, 'sync', this.render);
        }
    },
    highlight_row: function (nRow) {
        $(nRow).addClass('active').siblings().removeClass('active');
    },
    /**
     * Initiate a click event on a row.
     * @param index_or_node - the row index or row node.
     * @returns the row node or undefined.
     */
    select_row: function (index_or_node) {
        if (typeof index_or_node == 'number') {
            var length = this.length();

            if (this.length() <= 0) {
                return undefined;
            }
            else if (index_or_node + 1 > length) {
                return undefined;
            }
            else {
                var pos = this.get_selected_position();
                if (pos != index_or_node) {
                    // Only select if we are not already on the row.
                    var node = this.get_nodes(index_or_node);
                    if (node) {
                        $(node).click();
                    }
                    return node;
                }
                else {
                    return undefined;
                }
            }
        }
        else if (index_or_node) {
            $(index_or_node).click();
            return index_or_node;
        }
        else {
            return undefined;
        }
    },
    get_selected: function () {
        return this.$('tr.active');
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
    get_current_page: function () {
        var settings = this.get_settings();
        return Math.ceil(settings._iDisplayStart / settings._iDisplayLength) + 1;
    },
    get_total_rows: function () {
        if (this.get_settings().oInit.bServerSide) {
            return this.get_settings()._iRecordsTotal;
        }
        else {
            return this.get_nodes().length;
        }
    },
    get_total_pages: function () {
        var settings = this.get_settings();
        return Math.ceil(this.get_total_rows() / settings._iDisplayLength);
    },
    is_prev: function () {
        var pos = this.get_selected_position();
        return (pos > 0);
    },
    is_next: function () {
        var pos = this.get_selected_position();
        return pos + 1 < this.length();
    },
    peek_prev_data: function () {
        var selected = this.get_selected();
        if (selected !== undefined && selected.length == 1) {
            var pos = this.get_position(selected.get(0));
            return this.get_data(pos - 1)
        }
        // No previous.
        return undefined;
    },
    peek_next_data: function () {
        if (this.is_next()) {
            var selected = this.get_selected();
            if (selected !== undefined && selected.length == 1) {
                var pos = this.get_position(selected.get(0));
                return this.get_data(pos + 1);
            }
        }
        // No next.
        return undefined;
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
    is_prev_page: function () {
        return this.get_current_page() != 1;
    },
    is_next_page: function () {
        return this.get_current_page() < this.get_total_pages();
    },
    prev_page: function () {
        if (this.is_prev_page()) {
            this.set_page(this.get_current_page() - 2); // set page takes an index.
        }
    },
    next_page: function () {
        if (this.is_next_page()) {
            this.set_page(this.get_current_page()); // set page takes an index.
        }
    },
    /**
     * Set the current page of the table.
     * @param page_index - the zero based page index.
     */
    set_page: function (page_index) {
        var view = this;
        var current_page = view.get_current_page();
        if (page_index + 1 > current_page) {
            view._page_next = true;
        }
        else {
            view._page_prev = true;
        }
        this.get_table().fnPageChange(page_index);
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
    get_absolute_index: function (node) {
        if (this.get_settings().oInit.bServerSide) {
            return (this.get_current_page() - 1) * this.get_settings()._iDisplayLength + this.get_position(node);
        }
        else {
            return this.get_position(node);
        }
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
    is_server_side: function () {
        return this.get_settings().oInit.bServerSide;
    },
    reload: function (row_index) {
        if (row_index !== undefined) {
            this._row_index = row_index;
        }
        this.$el.fnDraw(false);
    },
    refresh: function (value_pair, bComplete) {
        if (value_pair) {
            this._value_pair = value_pair;
        }
        this.$el.fnDraw(false);
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
    /**
     * Render the table.  If you are obtaining data from a collection then don't invoke this method, call fetch()
     * instead.  If obtaining data via server side ajax then this method can be called with server side parameters.
     *
     *     table.render({server_params: {suppression_id: suppression_id}});
     *
     * @param params - the server side ajax parameters.  A map keyed by the name server_params.
     * @returns {*}
     */
    render: function (params) {
        var view = this;

        if (!view.el) {
            // Error
            alert('Error: Undefined "el" in TableView');
            return;
        }

        // Destroy the existing table if there is one.
        view.destroy();

        // Construct the table settings.
        var settings = StrikeFinder.get_datatables_settings(view, view.options);
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

        if (view.collection) {
            // If a collection is defined then use the data from the collection.
            settings['aaData'] = view.collection.toJSON();
        }

        // The following block is one time initialization for the table view and is specifically placed in the render
        // function to allow sub-classes to define an initialize method without having to worry about calling the
        // superclass initialization.
        view.run_once('TableView::render::init', function () {
            // Listen to draw events to account for the fact that datatables does not fire page change events.  This code
            // makes up for that shortcoming by manually determining when the user has used the previous next component to
            // page through the table.
            view.listenTo(view, 'draw', function () {
                if (view._page_prev) {
                    // User has iterated through the table to the previous page.
                    view.trigger('page', view.get_current_page());
                    // Select the last record in the current view.
                    view.select_row(view.length() - 1);
                    // Clear the flag.
                    view._page_prev = false;
                }
                else if (view._page_next) {
                    // User has iterated to through the table to the next page.
                    view.trigger('page', view.get_current_page());
                    // Select the next record in the view.
                    view.select_row(0);
                    // Clear the flag.
                    view._page_next = false;
                }

                if (view._row_index !== undefined) {
                    // During a refresh reload operation a row index to select has been specified.  Attempt to select
                    // the row that corresponds to the index.
                    view.select_row(view._row_index);
                    view._row_index = undefined;
                }
                else if (view._value_pair) {
                    // During a refresh/reload operation a value to select has been specified.  Attempt to select the
                    // row that corresponds to the supplied name value pair.
                    log.debug(_.sprintf('Attempting to reselect table row value: name=%s, value=%s',
                        view._value_pair.name, view._value_pair.value));

                    // Attempt to select the row related to the value pair after a draw event.
                    var found = false;
                    var nodes = this.get_nodes();
                    for (var i = 0; i < nodes.length; i++) {
                        var node = nodes[i];
                        var data = this.get_data(node);

                        if (view._value_pair.name &&
                            view._value_pair.value &&
                            data[view._value_pair.name] == view._value_pair.value) {

                            // Select the node.
                            this.select_row(node);

                            found = true;

                            break;
                        }
                    }

                    if (!found) {
                        // If the matching row was not found it is assumed that it was deleted, select the first
                        // row instead.
                        this.select_row(0);
                    }

                    // Clear the value pair.
                    view._value_pair = undefined;
                }
            });
        });

        // Create the table.
        var table = view.$el.dataTable(settings);

        if (view.$el.parent()) {
            // Assign the bootstrap class to the length select.
            var length_select = view.$el.parent().find('select');
            if (length_select) {
                length_select.addClass('form-control');
            }
        }

        return view;
    },
    fetch: function (params) {
        var view = this;
        if (view.collection) {
            if (params) {
                // User has supplied options to the fetch call.
                if (!params.success && !params.error) {
                    // Has not overidden the success and error callbacks, block for them.
                    params.success = function () {
                        StrikeFinder.unblock();
                    };
                    params.error = function () {
                        StrikeFinder.unblock();
                    };
                    StrikeFinder.block();
                    view.collection.fetch(params);
                }
                else {
                    // Don't do any blocking.
                    view.collection.fetch(params);
                }
            }
            else {
                // Block the UI before the fetch.
                StrikeFinder.block();
                view.collection.fetch({
                    success: function () {
                        // Unblock the ui.
                        StrikeFinder.unblock();
                    },
                    error: function () {
                        // Unblock the ui.
                        StrikeFinder.unblock();
                    }
                });
            }
        }
        else {
            StrikeFinder.run(function () {
                view.render({
                    'server_params': params
                });
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
    },
    /**
     * Escape a cell.
     */
    escape_cell: function(row, index) {
        var col = this.get_settings().aoColumns[index];
        var td = $(_.sprintf('td:eq(%s)', index), row);
        if (td) {
            td.html(_.escape(td.html()));
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
    /**
     * Tokenize a string based on whitespace and commas.
     * @param s - the input string.
     * @return the list of search terms.
     */
    parse_search_string: function (s) {
        var token_list = s.split(/[\s,]+/);
        var valid_tokens = [];
        _.each(token_list, function (t) {
            if (t != '') {
                valid_tokens.push(t);
            }
        });
        return valid_tokens;
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
                            term = view.parse_search_string(term);
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


