var StrikeFinder = StrikeFinder || {};


/**
 * Hits table view.
 */
StrikeFinder.HitsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el
        });

        view.options.sAjaxSource = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options.bServerSide = true;

        view.options.oLanguage = {
            sEmptyTable: 'No hits were found'
        };

        view.options.aoColumns = [
            {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
            {sTitle: "Created", mData: "created", bVisible: true, bSortable: true, sClass: 'nowrap'},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
            {sTitle: "rowitem_type", mData: "rowitem_type", bVisible: false, bSortable: false},
            {sTitle: "Tag", mData: "tagname", bSortable: true},
            {sTitle: "Summary", mData: "summary1", bSortable: true, sClass: 'wrap'},
            {sTitle: "Summary2", mData: "summary2", bSortable: true, sClass: 'wrap'},
            {sTitle: "MD5", mData: "md5sum", bSortable: true, sClass: 'nowrap'}
        ];

        view.options.aaSorting = [
            [1, 'desc']
        ];

        view.options.aoColumnDefs = [
            view.date_formatter(1)
        ];

        view.listenTo(view, 'load', function () {
            // Select the first row.
            view.select_row(0);
        });
        view.listenTo(view, 'click', function (row, ev) {
            var position = view.get_absolute_index(ev.currentTarget);

            var title;
            if (position !== undefined) {
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s of %s)', position + 1, view.get_total_rows());
            }
            else {
                title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', view.get_total_rows());
            }
            // Update the title with the count of the rows.
            view.hits_collapsable.set('title', title);
        });
        view.listenTo(view, 'empty', function () {
            title = _.sprintf('<i class="fa fa-list"></i> Hits (%s)', '0');
            view.hits_collapsable.set('title', title);
        });

        view.options.sDom = 'ltip';
        view.options.iDisplayLength = 10;
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
    render_service_down: function () {
        var view = this;
        view.$el.html(_.template($("#agent-host-error-template").html(), {am_cert_hash: view.model.id}));
    },
    fetch: function (am_cert_hash) {
        var view = this;
        view.model.clear();
        if (am_cert_hash) {
            view.model.id = am_cert_hash;
        }

        StrikeFinder.block_element(view.$el);

        view.model.fetch({
            error: function (model, response, options) {
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
    initialize: function (options) {
        var view = this;

        if (!view.collection) {
            view.collection = new StrikeFinder.IOCCollection([], {
                rowitem_uuid: options.rowitem_uuid
            });
        }

        // Filter by default.
        view.filtered = true;

        //view.listenTo(view.collection, 'sync', this.render);
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

        // Cleanup any existing components the view has created before rendering.
        view.close();

        var html = _.template($("#ioc-tabs-template").html(), data);
        view.$el.html(html);

        // Run the IOC viewer on all the pre-formatted elements.
        view.$el.find("pre").iocViewer();

        view.delegateEvents({
            'click #ioc-filter-button': 'on_click',
            'shown.bs.tab a[data-toggle="tab"]': 'on_shown'
        });

        // Filter by default.
        view.filter();

        return this;
    },
    select_tab: function (exp_key) {
        var view = this;
        if (exp_key) {
            // Select the specified tab.
            view.$el.find('li > a[name="' + exp_key + '"]').tab('show');
        }
        else {
            // Select the first tab.
            view.$el.find('li > a').first().tab('show');
        }
    },
    /**
     * Filter the IOC viewer to only the relevant hits.
     */
    filter: function () {
        var view = this;

        view.$el.find('#ioc-filter-button').html('<i class="fa fa-expand"></i> Expand IOC');

        // Iterator over the related IOC models and adjust the corresponding tab.
        _.each(view.collection.models, function (model, index, list) {
            var ioc_tab_selector = '#ioc-tab-' + index;
            var ioc_tab_element = view.$el.find(ioc_tab_selector);

            // Hide the metadata.
            //ioc_tab_element.find('.ioc-metadata').hide();

            // Find the root IOC definition.
            var ioc_definition_list = ioc_tab_element.find('.ioc-definition');
            if (ioc_definition_list.length != 1) {
                log.error('Unable to find IOC definition: ' + ioc_definition_list.length);
                //console.dir(ioc_definition_list);
            }
            var ioc_definition_element = ioc_definition_list;
            ioc_definition_element.addClass('highlighted');

            // Hide the root IOC definitions children.
            ioc_definition_element.find('ul, li').hide();

            // Get the highlighted items from the IOC's model.
            var selected_id_string = model.get('details');
            var selected_ids;
            if (selected_id_string.indexOf(',') != -1) {
                selected_ids = selected_id_string.split(',');
            }
            else {
                selected_ids = [selected_id_string];
            }

            // Iterate over the IOC's selected items.
            _.each(selected_ids, function (selected_id) {
                var selected_id_selector = '.ioc-guid-' + selected_id;
                var selected_element = ioc_definition_element.find(selected_id_selector);
                if (!selected_element) {
                    log.error('Unable to find selected element for selector: ' + selected_id_selector);
                }

                // Retrieve the full path of the element to the root.
                var selected_element_path = view.get_path(selected_element.get(0), ioc_definition_element.get(0));
                _.each(selected_element_path, function (selected_path_item) {
                    // Display the selected item.
                    view.$el.find(selected_path_item).show();
                    // Mark the item as highlighted so it's not hidden.
                    view.$el.find(selected_path_item).addClass('highlighted');
                });

                // Highlight the item.
                selected_element.find('> span.ioc-rule')
                    .css({'background': '#FFF79A', 'font-weight': 'bold', color: '#33311e'});
            });
        });

        $('#ioc-filter-button').val('Expand IOC');
    },
    /**
     * Remove any IOC filtering.
     */
    unfilter: function () {
        var view = this;

        view.$el.find('#ioc-filter-button').html('<i class="fa fa-compress"> Collapse IOC</i>');

        // Iterator over the related IOC models and adjust the corresponding tab.
        _.each(view.collection.models, function (model, index, list) {
            var ioc_tab_selector = '#ioc-tab-' + index;
            log.debug('ioc_tab_selection: ' + ioc_tab_selector);
            var ioc_tab_element = view.$el.find(ioc_tab_selector);

            // Find the root IOC definition.
            var ioc_definition_list = ioc_tab_element.find('.ioc-definition');
            if (ioc_definition_list.length != 1) {
                log.error('Unable to find IOC definition.');
            }
            // Display the children and remove any previous formatting.
            ioc_definition_list.find('*').show();
            //ioc_definition_list.find('*').removeClass('uac-opaque').removeClass('highlighted');
        });
    },
    /**
     * Handler for an IOC tab being selected.
     * @param ev - the related event.
     */
    on_shown: function (ev) {
        var view = this;
        var exp_key = ev.target.name;

        log.debug('Selected IOC with exp_key: ' + exp_key);
        view.trigger('ioc:selected', exp_key);

        if (!_.has(view.suppressions_table_map, exp_key)) {
            // Initialize the suppressions table for the expression.

            log.debug('Initializing suppressions table for exp_key: ' + exp_key);

            var suppressions_table = new StrikeFinder.SuppressionsTableView({
                el: view.$el.find(_.sprintf('table#%s.suppressions-table', exp_key)),
                condensed: true
            });
            view.listenTo(suppressions_table, 'delete', function () {
                // Trigger a higher level event when a suppression has been deleted.
                view.trigger('suppression:deleted');
            });

            view.suppressions_table_map[exp_key] = suppressions_table;

            suppressions_table.fetch(exp_key);
        }
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
            var inner = view.$el.find(element).children().length == 0 ? view.$el.find(element).text() : '';
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

        StrikeFinder.block_element(this.$el);
        this.collection.fetch();
    },
    close: function () {
        var view = this;

        // Clean up any of the existing tables and rows.
        if (view.suppressions_table_map) {
            log.debug('Closing ' + Object.keys(view.suppressions_table_map).length + ' suppression tables...');
            _.each(_.values(view.suppressions_table_map), function (table) {
                log.debug('Cleaning up table: ' + table.el.id);
                view.stopListening(table);
                table.close();
            });
        }
        view.suppressions_table_map = {};

        // Remove the elements from the DOM.
        view.remove();
    }
});

/**
 * File/Info details view.
 */
StrikeFinder.AuditView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;

        if (options.rowitem_uuid) {
            view.rowitem_uuid = options.rowitem_uuid;
        }

        if (!view.model) {
            this.model = new StrikeFinder.AuditModel({
                id: view.rowitem_uuid
            });
        }

        this.listenTo(this.model, 'sync', this.render);
    },
    render: function () {
        var view = this;

        view.$el.html(view.model.get('content'));

        StrikeFinder.collapse(this.el);

        return this;
    },
    fetch: function (rowitem_uuid) {
        var view = this;

        if (rowitem_uuid) {
            view.model.id = rowitem_uuid;
        }

        StrikeFinder.block_element(view.$el);

        view.model.fetch();
    }
});

/**
 * View for displaying context menu in the File/Info view.
 */
StrikeFinder.AuditContextMenuView = StrikeFinder.View.extend({
    initialize: function () {
        this.render();
    },
    events: {
        "click #suppress-item": "suppress",
        "click #auto-suppress-item": "auto_suppress",
        "click #acquire-item": "acquire",
        "click #tag-item": "tag",
        "click #close-item": "cancel"
    },
    render: function () {
        var view = this;

        $(view.options.source).highlighter({
            selector: _.sprintf('#%s', view.el.id),
            complete: function (selection, el) {

                // TODO: Clean this up.

                var child_elements;

                // Try and get the element the user clicked on.
                if (el && el.anchorNode && el.anchorNode.parentElement) {

                    var span = el.anchorNode.parentElement;
                    if (span && $(span).hasClass('ioc-term')) {
                        // The user clicked on an IOC term span.
                        var term1 = $(span).attr('ioc-term');
                        log.debug('ioc-term: ' + term1);
                        view.ioc_term = term1;
                        view.$('#ioc-term-item').text(term1);
                        view.$('#auto-suppress-item').css('display', 'block');
                    }
                    else if ((child_elements = $(el.anchorNode).find('.ioc-term')) && child_elements.length == 1) {
                        // The user clicked an IOC term.
                        var term2 = child_elements.attr('ioc-term');
                        log.debug('ioc-term: ' + term2);
                        view.ioc_term = term2;
                        view.$('#ioc-term-item').text(term2);
                        view.$('#auto-suppress-item').css('display', 'block');
                    }
                    else {
                        // Auto suppress is not available.
                        view.$('#auto-suppress-item').css('display', 'none');
                    }
                }
                else {
                    // Auto suppress is not available.
                    view.$('#auto-suppress-item').css('display', 'none');
                }

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

        var template = _.template($("#audit-context-menu-template").html(), data);
        view.$el.html(template);
    },
    suppress: function (ev) {
        this.trigger("suppress", this.selection, this.ioc_term);
        this.$el.hide();
    },
    auto_suppress: function (ev) {
        this.trigger("auto-suppress", this.selection, this.ioc_term);
        this.$el.hide();
    },
    acquire: function (ev) {
        this.trigger("acquire", this.selection);
        this.$el.hide();
    },
    tag: function (ev) {
        this.trigger('tag', this.selection, this.ioc_term);
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
        else if (!params.itemvalue) {
            // Error, itemvalue is required.
            throw new Error('"itemvalue" is undefined.');
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
            itemvalue: params.itemvalue,
            rowitem_type: params.rowitem_type,
            exp_key: params.exp_key,
            cluster_uuid: params.cluster_uuid,
            am_cert_hash: params.am_cert_hash
        });

        if (params.itemkey) {
            view.model.set('itemkey', params.itemkey);
        }

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
        if (params.iocs) {
            data.iocs = params.iocs.toJSON();
        }
        else {
            data.iocs = [];
        }

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
            StrikeFinder.block_element(form, 'Processing...');

            // Update the model with the form data.
            view.model.set('exp_key', view.$("#exp_key").children(":selected").attr("id"));
            view.model.set('tagname', view.$("#tagname").val());
            view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
            view.model.set('condition', view.$("#condition").val());
            view.model.set('negate', view.$("#negate").is(":checked"));
            view.model.set('preservecase', view.$("#preservecase").is(":checked"));
            view.model.set('itemvalue', view.$("#itemvalue").val());
            view.model.set('comment', view.$('#comment').val());

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
        }
        finally {
            StrikeFinder.unblock(form);
        }

        StrikeFinder.block_element(form, 'Processing...');
        view.model.save({}, {
            success: function (model, response, options) {
                var task_id = response.task_id;

                // Submitted the task successfully.
                StrikeFinder.display_success('Submitted task for mass tag: ' + view.model.as_string());

                StrikeFinder.wait_for_task(response.task_id, function (err, completed, response) {
                    StrikeFinder.unblock(form);

                    if (err) {
                        // Error
                        StrikeFinder.display_error(err);
                    }
                    else if (completed) {
                        // The task was completed successfully.
                        var success_message = 'Successfully tagged %s hit(s) with for: %s';
                        StrikeFinder.display_success(_.sprintf(success_message,
                            response.result.summary, view.model.as_string()));

                        // Notify that the mass tag was created.
                        view.trigger('create', view.model);

                        // Hide the form.
                        view.$("#mass-tag-form").modal("hide");
                    }
                    else {
                        // The task is still running.
                        var task_message = _.sprintf('The task for mass tag: %s is still running and ' +
                            'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                            view.model.as_string());
                        StrikeFinder.display_info(task_message);

                        // Hide the form.
                        view.$("#mass-tag-form").modal("hide");
                    }
                });
            },
            error: function (model, xhr) {
                // Error submitting the tag task.
                try {
                    var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                    StrikeFinder.display_error('Error while submitting mass tag task - ' + message);
                }
                finally {
                    StrikeFinder.unblock(form);
                }
            }
        });

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

        var itemvalue = params.itemvalue;
        var rowitem_type = params.rowitem_type;
        var exp_key = params.exp_key;
        var cluster_uuid = params.cluster_uuid;

        log.debug('Creating suppression for exp_key: ' + exp_key);
        if (!params) {
            // Error, params are required.
            throw new Error('"params" is undefined.');
        }
        else if (!params.exp_key) {
            // Error, exp_key is required.
            throw new Error('"exp_key" is undefined.');
        }
        else if (!params.itemvalue) {
            // Error, itemvalue is required.
            throw new Error('"itemvalue" is undefined.');
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
            itemvalue: itemvalue,
            rowitem_type: rowitem_type,
            exp_key: exp_key,
            cluster_uuid: cluster_uuid
        });

        if (params.itemkey) {
            view.model.set('itemkey', params.itemkey);
        }

        // Deep copy the model values.
        var data = view.model.toJSON();

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
            data.terms = [];
        }

        // Add the ioc's.
        if (params.iocs) {
            data.iocs = params.iocs.toJSON();
        }
        else {
            data.iocs = [];
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
        var form = $('#suppression-form');
        try {
            StrikeFinder.block_element(form, 'Processing...');

            // Update the model.
            view.model.set('exp_key', view.$("#exp_key").children(":selected").attr("id"));
            view.model.set('comment', view.$("#comment").val());
            view.model.set('condition', view.$("#condition").val());
            view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
            view.model.set('itemvalue', view.$("#itemvalue").val());
            view.model.set('negate', view.$("#negate").is(":checked"));
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
        }
        finally {
            StrikeFinder.unblock(form);
        }

        StrikeFinder.block_element(form, 'Processing...');
        view.model.save({}, {
            success: function (model, response) {
                var submit_message = _.sprintf('Submitted task for suppression: %s',
                    view.model.as_string());

                StrikeFinder.display_success(submit_message);

                StrikeFinder.wait_for_task(response.task_id, function (err, completed, response) {
                    // Unblock the UI.
                    StrikeFinder.unblock(form);

                    if (err) {
                        // Error
                        StrikeFinder.display_error(err);
                    }
                    else if (completed) {
                        // The task was completed successfully.
                        var success_message = 'Successfully suppressed %s hit(s) with suppression: %s';
                        StrikeFinder.display_success(_.sprintf(success_message,
                            response.result.summary, view.model.as_string()));

                        // Notify that a suppression was created.
                        view.trigger('create', view.model);

                        // Hide the form.
                        view.$("#suppression-form").modal("hide");
                    }
                    else {
                        var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                            'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                            view.model.as_string());
                        StrikeFinder.display_info(task_message);

                        // Hide the form.
                        view.$("#suppression-form").modal("hide");
                    }
                });
            },
            error: function (model, xhr) {
                try {
                    var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                    StrikeFinder.display_error('Error while submitting suppression task - ' + message);
                }
                finally {
                    StrikeFinder.unblock(form);
                }
            }
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
        var acquire_form = view.$('#acquire-form', 'Processing...');

        try {
            // Immediately block to prevent multiple submissions.
            StrikeFinder.block_element(acquire_form);

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

        StrikeFinder.block_element(acquire_form, 'Processing...');
        view.model.save({}, {
            success: function (model, response, options) {
                try {
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
                }
                finally {
                    StrikeFinder.unblock(acquire_form);
                }
            },
            error: function (model, xhr, options) {
                try {
                    StrikeFinder.display_error('Error submitting acquisition request.');
                }
                finally {
                    StrikeFinder.unblock(acquire_form);
                }
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

StrikeFinder.CommentsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;
        view.options.iDisplayLength = -1;
        view.options.aoColumns = [
            {sTitle: "Created", mData: "created", sWidth: "20%", bSortable: true},
            {sTitle: "Comment", mData: "comment", sWidth: "60%", bSortable: true},
            {sTitle: "User", mData: "user_uuid", sWidth: "20%", bSortable: true}
        ];
        view.options.aaSorting = [
            [ 0, "desc" ]
        ];
        view.options.aoColumnDefs = [
            {
                mRender: function (data, type, row) {
                    return StrikeFinder.format_date_string(data);
                },
                aTargets: [0]
            }
        ];
        view.options.oLanguage = {
            sEmptyTable: 'No comments have been entered'
        };

        view.listenTo(view, 'row:created', function (row, data, index) {
            view.escape_cell(row, 1);
        });

        if (!view.collection) {
            view.collection = new StrikeFinder.CommentsCollection();
        }
        view.listenTo(view.collection, 'sync', view.render);
    },
    /**
     * Load the comments based on the row item.
     * @param rowitem_uuid - the row item.
     */
    fetch: function (rowitem_uuid) {
        var view = this;

        if (rowitem_uuid) {
            this.collection.rowitem_uuid = rowitem_uuid;
        }
        StrikeFinder.block_element(view.$el);
        this.collection.fetch({
            success: function () {
                StrikeFinder.unblock(view.$el);
            },
            error: function () {
                StrikeFinder.unblock(view.$el);
            }
        });
    }
});
/**
 * View to display and create comments.
 */
StrikeFinder.CommentsView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;
        if (options.rowitem_uuid) {
            view.rowitem_uuid = options.rowitem_uuid;
        }

        view.comments_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '<i class="fa fa-comments"></i> Comments'
        });

        view.comments_table = new StrikeFinder.CommentsTableView({
            el: view.$("#comments-table")
        });
    },
    events: {
        "click button": "add_comment",
        "keyup #comment": "on_keyup"
    },
    fetch: function (rowitem_uuid) {
        this.rowitem_uuid = rowitem_uuid;
        this.comments_table.fetch(this.rowitem_uuid);
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
        var comment = view.$("#comment").val();
        if (!comment || comment.trim() == "") {
            log.warn('No comment value found.');
            return;
        }

        log.debug("Creating comment for rowitem_uuid: " + view.rowitem_uuid);

        var new_comment = new StrikeFinder.CommentsModel({
            comment: comment,
            rowitem_uuid: view.rowitem_uuid
        });

        log.debug('Comment rowitem_uuid: ' + new_comment.get('rowitem_uuid'));

        StrikeFinder.block_element(view.$el);
        new_comment.save([], {
            async: false,
            success: function (model, response, options) {
                StrikeFinder.unblock(view.$el);

                $("#comment").val("");
                view.comments_table.fetch();
            },
            error: function (model, xhr) {
                // Error
                StrikeFinder.unblock(view.$el);
                var details = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                StrikeFinder.display_error('Error while creating new comment. - ' + details);
            }
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
        // Initialize the list of possible tag values.
        this.tags = new StrikeFinder.TagCollection(StrikeFinder.tags);

        if (this.model) {
            // Re-draw the tags view whenever the model is reloaded.
            this.listenTo(this.model, 'sync', this.render);
        }
    },
    events: {
        'click .dropdown-menu > li > a': 'on_click'
    },
    render: function () {
        var view = this;
        var disabled = view.options.disabled === true;
        var tagname = view.model.get('tagname');
        var selected_value = undefined;

        // Get the drop down menu.
        var menu = view.$('.dropdown-menu');
        // Remove any child elements.
        menu.empty();

        view.tags.each(function (item) {
            var item_name = item.get('name');
            var item_title = item.get('title');

            if (tagname && tagname == item_name) {
                // Save off the value to display.
                selected_value = item_title;

                if (!disabled) {
                    menu.append(_.sprintf('<li><a name="%s" title="%s">%s &#10004;</a></li>',
                        item_name, item_name, item_title));
                }
            }
            else if (!disabled) {
                menu.append(_.sprintf('<li><a name="%s" title="%s">%s</a></li>',
                    item_name, item_name, item_title));
            }
        });

        if (selected_value) {
            view.$('.selected').html(selected_value);
        }

        if (disabled) {
            // Disable the tag component.
            view.$el.find('button').prop('disabled', true);
        }

        return view;
    },
    on_click: function (ev) {
        StrikeFinder.block();

        var view = this;
        var tagname = $(ev.currentTarget).attr('name');
        var uuid = view.model.get('uuid');

        log.debug(_.sprintf('Setting tag: %s on rowitem_uuid: %s', tagname, uuid));

        var tag_model = new StrikeFinder.SetTagModel({
            rowitem_uuid: uuid,
            tagname: tagname
        });
        tag_model.save({}, {
            async: false,
            success: function () {
                try {
                    view.trigger('create', uuid, tagname);
                    log.debug(_.sprintf('Applied tag: %s to rowitem_uuid: %s', tagname, uuid));
                    StrikeFinder.display_success('Successfully applied tag: ' + tagname);
                }
                finally {
                    StrikeFinder.unblock();
                }
            },
            error: function () {
                StrikeFinder.unblock();
                StrikeFinder.display_error('Error while applying tag.');
            }
        });
    }
});

StrikeFinder.HitsLinkView = StrikeFinder.View.extend({
    initialize: function(options) {
        if (options.table) {
            this.listenTo(options.table, 'click', this.render);
        }
    },
    render: function(data) {
        var view = this;

        view.close();

        var link = window.location.protocol + '//' + window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') + '/sf/hits/' + data.uuid;
        var html = _.template($("#link-template").html(), {link: link, label: 'Link to Hit'});

        view.$el.popover({
            html : true,
            trigger: 'click',
            content: html
        });
        view.$el.on('shown.bs.popover', function () {
            $('.link-text').select();
        });
    },
    close: function() {
        this.$el.popover('destroy');
        // Manually removing the popover due to -> https://github.com/twbs/bootstrap/issues/10335
        this.$el.parent().find('.popover').remove();
    }
});

StrikeFinder.IdentitiesView = StrikeFinder.View.extend({
    initialize: function (options) {
        if (this.model) {
            // Re-draw the view whenever the model is reloaded.
            this.listenTo(this.model, 'sync', this.render);
        }
    },
    events: {
        'click .dropdown-menu > li > a': 'on_click'
    },
    render: function () {
        var view = this;

        // Get the drop down menu.
        var menu = view.$('.dropdown-menu');
        // Remove any child elements.
        menu.empty();

        var uuid = view.model.get('uuid');
        var identical_hits = view.model.get('identical_hits');
        var selected = undefined;

        // Debug
        log.debug('Found ' + identical_hits.length + ' identical hits for row: ' + uuid);

        if (identical_hits.length == 0) {
            view.$el.find('button').prop('disabled', true);

            view.$('.selected').html(view.get_title(view.model.get('created'), null, true, false, false));
        }
        else if (identical_hits.length == 1) {
            view.$el.find('button').prop('disabled', true);

            var hit = identical_hits[0];
            view.$('.selected').html(view.get_title(hit.created, null, true, false, false));
        }
        else {
            view.$el.find('button').prop('disabled', false);

            _.each(identical_hits, function (hit, index) {
                if (uuid == hit.uuid) {
                    // This is the item being displayed, don't put it in the list.  Update the title instead.
                    view.$('.selected').html(view.get_title(hit.created, null, index == 0, false, true));

                    menu.append(_.sprintf('<li><a name="%s">%s</a></li>',
                        hit.uuid, view.get_title(hit.created, hit.tagtitle, index == 0, true, false)));
                }
                else {
                    // Item is not the one being render, add to the list of selections.
                    menu.append(_.sprintf('<li><a name="%s">%s</a></li>',
                        hit.uuid, view.get_title(hit.created, hit.tagtitle, index == 0, false, false)));
                }
            });
        }

        return view;
    },
    /**
     * Create a common title string for the menu items.
     * @param created - the row created date.
     * @param tag - the tagname value.
     * @param is_current - if the item is the latest.
     * @param is_caret - whether to include a caret in the output.
     * @returns {string} - the title string.
     */
    get_title: function (created, tag, is_current, is_selected, is_caret) {
        var selected_string = is_selected ? '&#10004;' : '';
        var target_string = is_current ? '&#42;' : '';
        var caret_string = is_caret ? ' <span class="caret"></span>' : '';
        var tag_string = tag ? ' - ' + tag : '';
        return _.sprintf('%s %s %s %s %s', StrikeFinder.format_date_string(created), tag_string, target_string, selected_string, caret_string);
    },
    on_click: function (ev) {
        var view = this;
        // Get the selected uuid.
        var selected_uuid = $(ev.currentTarget).attr('name');

        if (selected_uuid != view.model.get('uuid')) {
            // Debug
            log.debug('Selected identity: ' + selected_uuid);
            // Trigger an event that the row uuid was selected.
            view.trigger('click', selected_uuid);
        }
    }
});

StrikeFinder.MergeAllView = StrikeFinder.View.extend({
    initialize: function () {
        if (this.model) {
            this.listenTo(this.model, 'sync', this.render);
        }
    },
    events: {
        'click': 'on_click'
    },
    render: function() {
        var view = this;

        var current_uuid = view.model.get('uuid');
        var identical_hits = view.model.get('identical_hits');

        if (identical_hits && identical_hits.length == 1) {
            // There is only a single identity.
            view.$el.prop('disabled', true);
            view.$el.show();
        }
        else {
            // There are multiple identities.
            if (current_uuid == identical_hits[0].uuid) {
                // The current identity is the most recent, enable merge all.
                view.$el.prop('disabled', false);
                view.$el.show();
            }
            else {
                // The current identity is not the most recent.
                view.$el.prop('disabled', true);
                view.$el.hide();
            }
        }
    },
    /**
     * Handle the click of the merge all button.
     * @param ev - the click event.
     */
    on_click: function (ev) {
        var view = this;
        var uuid = view.model.get('uuid');
        var merge_model = new Backbone.Model();
        merge_model.url = '/sf/api/hits/' + uuid + '/mergeall';
        merge_model.save({}, {
            success: function (model, response) {
                try {
                    log.info(_.sprintf('Merged all identities for uuid: %s', uuid));
                    StrikeFinder.display_success('Successfully merged all identities.');

                    // Notify that a merge has taken place.
                    view.trigger('mergeall', uuid, response.uuid);
                }
                finally {
                    StrikeFinder.unblock();
                }
            },
            error: function () {
                // Error.
                StrikeFinder.unblock();
                StrikeFinder.display_error('Error while performing mergeall.');
            }
        });
    }
});

/**
 * View for displaying the merge button and handling the related actions.
 */
StrikeFinder.MergeView = StrikeFinder.View.extend({
    initialize: function (options) {
        if (this.model) {
            // Re-draw the view whenever the model is reloaded.
            this.listenTo(this.model, 'sync', this.render);
        }
    },
    events: {
        'click': 'on_click'
    },
    render: function () {
        var view = this;

        var current_uuid = view.model.get('uuid');
        var identical_hits = view.model.get('identical_hits');

        // Enable the merge option when there are more than one identical hits and the currently selected identity
        // is not the target of the merge operation.
        if (identical_hits && identical_hits.length > 1 && current_uuid != identical_hits[0].uuid) {
            view.$el.prop('disabled', false);
            view.$el.show();
        }
        else {
            view.$el.prop('disabled', true);
            view.$el.hide();
        }
    },
    /**
     * Handle the click of the merge button.
     * @param ev - the click event.
     */
    on_click: function (ev) {
        var view = this;
        StrikeFinder.block();

        // Merge the current identity into the current.
        var uuid = view.model.get('uuid');
        var merge_model = new Backbone.Model();
        merge_model.url = '/sf/api/hits/' + uuid + '/merge';
        merge_model.save({}, {
            success: function (model, response) {
                try {
                    log.debug('Merged ' + uuid + ' into ' + response.uuid);

                    StrikeFinder.display_success('Successfully merged identities.');

                    // Notify that a merge has taken place.
                    view.trigger('merge', uuid, response.uuid);
                }
                finally {
                    StrikeFinder.unblock();
                }
            },
            error: function () {
                // Error.
                StrikeFinder.unblock();
                StrikeFinder.display_error('Error while performing merge.');
            }
        });
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

        // Create the link view for displaying hit url links.
        view.link_view = new StrikeFinder.HitsLinkView({
            el: '#link-button',
            table: view.hits_table_view
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

        log.debug('Hits row selected: ' + JSON.stringify(data));

        view.run_once('init_details', function () {
            //
            // Initialize the details components.

            // Prev/next controls.
            view.prev_next_view = new StrikeFinder.TableViewControls({
                el: '#prev-next-div',
                table: view.hits_table_view,
                paging: false
            });
            view.prev_next_view.render();

            // Agent host view.
            view.agenthost_view = new StrikeFinder.AgentHostView({
                el: '#agent-host-div'
            });

            // IOC tabs view.
            view.iocs = new StrikeFinder.IOCCollection();
            view.ioc_tabs_view = new StrikeFinder.IOCTabsView({
                collection: view.iocs
            });
            view.listenTo(view.ioc_tabs_view, 'ioc:selected', function (exp_key) {
                // Update the hits details view expression key whenever an IOC tab is selected.
                view.exp_key = exp_key;
                log.debug('Hits details view now associated with exp_key: ' + exp_key);
            });
            view.listenTo(view.ioc_tabs_view, 'suppression:deleted', function () {
                // Reload the hits after a suppression has been deleted.  Attempt to select the same row that we are
                // current positioned on.
                view.hits_table_view.refresh({
                    name: 'uuid',
                    value: view.row.uuid
                });
            });
            view.listenTo(view.iocs, 'sync', function () {
                // Reload the tabs view.
                $('#iocs-div').html(view.ioc_tabs_view.render().el);
                // Select and IOC tab.
                view.ioc_tabs_view.select_tab(view.default_exp_key);
            });

            // Audit view.
            view.audit = new StrikeFinder.AuditModel();
            view.audit_view = new StrikeFinder.AuditView({
                el: $("#audit-div"),
                model: view.audit
            });

            // Update the audit type on the view.
            view.listenTo(view.audit, 'sync', function () {
                $('#audit-type').html(view.audit.get('rowitem_type'));
            });

            // Initialize the tag view from the audit data.
            var tagging_enabled = !'tag' in view.options || view.options.tag !== false;
            // Display the tags view unless explicitly disabled.
            view.tags_view = new StrikeFinder.TagView({
                el: '#tags',
                model: view.audit,
                disabled: !tagging_enabled
            });
            if (tagging_enabled) {
                // Only listen to create events if tagging is enabled.
                view.listenTo(view.tags_view, 'create', function (rowitem_uuid, tagname) {
                    // Reload the details view.
                    view.fetch(rowitem_uuid);
                    // We have tagged the Trigger an event when a new tag has been created.
                    view.trigger('create:tag', rowitem_uuid, tagname);
                });
            }

            // Initialize the identities view.
            view.identities_view = new StrikeFinder.IdentitiesView({
                el: '#identities',
                model: view.audit
            });
            view.listenTo(view.identities_view, 'click', function (uuid_identity) {
                view.fetch(uuid_identity);
            });

            // Merge all button view.
            view.merge_all_view = new StrikeFinder.MergeAllView({
                el: '#merge-all',
                model: view.audit
            });
            view.merge_all_view.listenTo(view.merge_all_view, 'mergeall', function(uuid) {

            });

            // Merge button view.
            view.merge_view = new StrikeFinder.MergeView({
                el: '#merge',
                model: view.audit
            });

            /**
             * Generic method for handling merge and mergeall.
             * @param uuid - the destination uuid.
             */
            function handle_merge(uuid) {
                // A merge operation has taken place, reload the hits view.
                if (view.row.uuid == uuid) {
                    // The currently selected row is the merge destination.  Reload the hits and re-select the same
                    // the target row item.
                    view.hits_table_view.refresh({
                        name: 'uuid',
                        value: uuid
                    });
                }
                else {
                    // The currently selected row is not the destination and has been deleted as part of the merge
                    // operation.

                    log.debug('The item being merged is being deleted...');

                    var next_data = view.hits_table_view.peek_next_data();
                    if (next_data) {
                        // Select the next row.
                        view.hits_table_view.refresh({
                            name: 'uuid',
                            value: next_data.uuid
                        });
                    }
                    else {
                        var prev_data = view.hits_table_view.peek_prev_data();
                        if (prev_data) {
                            // Select the previous row.
                            view.hits_table_view.refresh({
                                name: 'uuid',
                                value: prev_data.uuid
                            })
                        }
                        else {
                            // Try and select the first row if there is one.
                            view.hits_table_view.select_row(0);
                        }
                    }
                }
            }

            view.listenTo(view.merge_view, 'merge', function (source_uuid, dest_uuid) {
                handle_merge(dest_uuid);
            });
            view.listenTo(view.merge_all_view, 'mergeall', function(uuid) {
                handle_merge(uuid);
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
            view.context_menu = new StrikeFinder.AuditContextMenuView({
                el: $("#context-menu-div"),
                source: "#audit-div",
                suppress: view.options.suppress,
                acquire: view.options.acquire,
                masstag: view.options.masstag
            });
            view.listenTo(view.context_menu, 'suppress', function (selection, ioc_term) {
                log.debug(_.sprintf('Creating suppression for text: %s, rowitem_type: %s, and term: %s',
                    selection, data.rowitem_type, ioc_term));

                var options = {
                    itemvalue: selection,
                    rowitem_type: view.row.rowitem_type,
                    exp_key: view.exp_key,
                    cluster_uuid: view.row.cluster_uuid,
                    iocs: view.iocs
                };

                if (ioc_term) {
                    options.itemkey = ioc_term;
                }
                // Display the suppression form.
                view.suppression_form_view.render(options);
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
            view.listenTo(view.context_menu, 'tag', function (selection, ioc_term) {
                var agent_host_data = view.agenthost_view.attributes();
                view.mass_tag_form.render({
                    itemvalue: selection,
                    itemkey: ioc_term,
                    exp_key: view.exp_key,
                    am_cert_hash: view.row.am_cert_hash,
                    cluster_uuid: view.row.cluster_uuid,
                    rowitem_uuid: view.row.rowitem_uuid,
                    rowitem_type: view.row.rowitem_type,
                    iocs: view.iocs
                });
            });
            view.listenTo(view.context_menu, 'auto-suppress', function (selection, ioc_term) {
                // Auto create a suppression.
                var suppression_model = new StrikeFinder.SuppressionModel({
                    itemvalue: selection,
                    rowitem_type: view.row.rowitem_type,
                    exp_key: view.exp_key,
                    cluster_uuid: view.row.cluster_uuid,
                    comment: selection,
                    condition: 'is',
                    itemkey: ioc_term,
                    preservecase: false
                });
                // Validate the model before saving.
                if (!suppression_model.isValid()) {
                    // Error
                    errors = view.model.validationError;
                    _.each(errors, function (error) {
                        StrikeFinder.display_error(error);
                    });
                }
                else {
                    // Ok.
                    StrikeFinder.block();

                    suppression_model.save({}, {
                        success: function (model, response) {
                            // The task has been submitted for the suppression.
                            var submit_message = _.sprintf('Submitted task for suppression: %s',
                                suppression_model.as_string());
                            StrikeFinder.display_success(submit_message);

                            // Try and wait for the task result.
                            StrikeFinder.wait_for_task(response.task_id, function (err, completed, response) {
                                StrikeFinder.unblock();

                                if (err) {
                                    // Error checking the task result.
                                    StrikeFinder.display_error(err);
                                }
                                else if (completed) {
                                    // The task was completed successfully.
                                    var msg = _.sprintf('Successfully suppressed %s hits for %s',
                                        response.result.summary, suppression_model.as_string());
                                    StrikeFinder.display_success(msg);

                                    // Notify that a suppression was created.
                                    view.trigger('create:suppression', view.row, suppression_model);
                                }
                                else {
                                    // The task did not complete and is running in the background.
                                    var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                        'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                        suppression_model.as_string());
                                    StrikeFinder.display_info(task_message);
                                }
                            });
                        },
                        error: function () {
                            try {
                                var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                                StrikeFinder.display_error('Error while submitting auto suppression task - ' + message);
                            }
                            finally {
                                StrikeFinder.unblock();
                            }
                        }
                    });
                }
            });

            // Comments view.
            view.comments_view = new StrikeFinder.CommentsView({
                el: '#comments-div'
            });
        });

        view.fetch();
    },
    fetch: function (uuid_identity) {
        var view = this;

        // Update the child views with the current row's parameters.

        var uuid;
        if (uuid_identity) {
            uuid = uuid_identity;
        }
        else {
            uuid = view.row.uuid;

            // Update the host data unless we are just changing to another identity.  Assumes that other identities
            // are always for the same host.
            view.agenthost_view.fetch(view.row.am_cert_hash);
        }

        // Fetch the related audit and update the audit view, tags view, and identity data.
        view.audit.set('id', uuid, {silent: true});
        view.audit.fetch();

        // Update the IOC.
        view.ioc_tabs_view.fetch(uuid);

        // Update the comments.
        view.comments_view.fetch(uuid);

        $('.sf-details-view').fadeIn().show();
    }
});

/**
 * View for the hits screen.
 */
StrikeFinder.HitsView = StrikeFinder.View.extend({
    initialize: function (options) {
        var view = this;

        view.params = {};

        // Hits.
        view.hits_table_view = new StrikeFinder.HitsTableView({
            el: '#hits-table'
        });

        // Initialize the hits details view.
        view.hits_details_view = new StrikeFinder.HitsDetailsView({
            el: '#hits-details-div',
            hits_table_view: view.hits_table_view
        });
        view.listenTo(view.hits_details_view, 'create:tag', function (rowitem_uuid, tagname) {
            // A new tag has been created, loop through the table nodes and manually update the tagname
            // for the relevant row.  This is a shortcut rather than re-loading the entire table.
            view.hits_table_view.update_row('uuid', rowitem_uuid, 'tagname', tagname, 1);
        });
        view.listenTo(view.hits_details_view, 'create:acquire', function (row, model) {
            // An acquisition has been created, update the row's tag value.
            view.hits_table_view.update_row('uuid', row.uuid, 'tagname', 'investigating', 1);
            // Refresh the comments.
            view.hits_details_view.fetch();
        });
        view.listenTo(view.hits_details_view, 'create:suppression', function () {
            // Reload the facets after a suppression is created.
            view.facets_view.fetch();
        });
        view.listenTo(view.hits_details_view, 'create:masstag', function () {
            // Reload the facets after a suppression is created.
            view.facets_view.fetch();
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
    },
    fetch: function (params) {
        var view = this;

        if (params) {
            view.params = params;
        }

        log.debug(_.sprintf('Rendering hits view with params: %s', JSON.stringify(view.params)));

        // Check whether enough parameters have been passed to render the hits view.
        var is_base_defined = view.params.services && view.params.services.length > 0 && view.params.clusters &&
            view.params.clusters.length > 0;
        var is_exp_key_defined =  is_base_defined && view.params.exp_key;
        var is_ioc_uuid_defined = is_base_defined && view.params.ioc_uuid;
        var is_iocnamehash_defined = is_base_defined && view.params.iocnamehash;

        if (view.params.rowitem_uuid) {
            // Specific row items have been specified.
            log.debug('Displaying row items: ' + JSON.stringify(view.params));
            view.fetch_callback();
        }
        else if (!is_exp_key_defined && !is_ioc_uuid_defined && is_iocnamehash_defined) {
            // Not enough data to render the hits view, navigate to the shopping view.
            // TODO: Disable the hits link for this case instead.
            alert('You must select shopping criteria before viewing hits.');
            window.location = '/sf/';
        }
        else if (view.params.checkout) {
            // Valid params have been supplied to the view and checkout is enabled.

            log.debug('Checking out hits...');

            var checkout_criteria = new StrikeFinder.UserCriteriaModel({
                services: view.params.services.join(','),
                clusters: view.params.clusters.join(','),
                exp_key: view.params.exp_key
            });
            checkout_criteria.save({}, {
                success: function (model, response, options) {
                    log.debug('Created user token: ' + response.usertoken);
                    view.params.usertoken = response.usertoken;
                    view.fetch_callback();
                },
                error: function (model, xhr, options) {
                    // Error.
                    StrikeFinder.display_error("Exception while processing checkout of hits.");
                    console.dir(model);
                }
            });
        }
        else {
            // Display by the parameters without checkout.
            log.debug('Rendering without checking out...');
            view.fetch_callback();
        }
    },
    fetch_callback: function () {
        var view = this;
        // Update the hits details view with the current selected expression.

        // This should be used to select the IOC expression by default.
        view.hits_details_view.default_exp_key = view.params.exp_key;

        // Update the hits criteria.
        var params = {
            identity_rollup: true
        };
        if (view.params.rowitem_uuid) {
            params.rowitem_uuid = [view.params.rowitem_uuid];
            view.facets_view.fetch(params);
        }
        else if (view.params.usertoken) {
            params.usertoken = [view.params.usertoken];
            view.facets_view.fetch(params);
        }
        else {
            params.services = view.params.services;
            params.clusters = view.params.clusters;
            if (params.exp_key) {
                params.exp_key = [view.params.exp_key];
            }
            else if (params.iocnamehash) {
                params.iocnamehash = view.params.iocnamehash;
            }
            else if (params.ioc_uuid) {
                params.ioc_uuid = view.params.ioc_uuid;
            }
            view.facets_view.fetch(params);
        }
    }
});

/**
 * View to render hits facets.
 */
StrikeFinder.HitsFacetsView = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;

        // TODO: move the outwards.
        view.titles = {
            username: 'User',
            md5sum: 'MD5',
            tagname: 'Tag',
            iocname: 'IOC',
            item_type: 'Item Type',
            am_cert_hash: 'AM Cert Hash'
        };

        view.icons = {
            username: 'fa-users',
            md5sum: 'fa-file',
            tagname: 'fa-tags',
            iocname: 'fa-warning',
            item_type: 'fa-info',
            am_cert_hash: 'fa-desktop'
        };

        view.keys = [
            'tagname',
            'iocname',
            'item_type',
            'md5sum',
            'am_cert_hash',
            'username'
        ];

        // Create the facets model.
        view.model = new StrikeFinder.HitsFacetsModel();
        // Redraw the facets on sync.
        view.listenTo(view.model, 'sync', view.render);

        // Create the criteria.
        view.criteria = new StrikeFinder.HitsCriteria();
    },
    /**
     * Shorten a string value.
     * @param s - the string.
     * @param length - the total length the result string should be.
     * @returns - a shortened string.
     */
    shorten: function (s, length) {
        if (!length) {
            length = 8;
        }
        if (s && s.length > length) {
            var section_length = length / 2;
            return s.substring(0, section_length) + '...' + s.substring(s.length - section_length, s.length);
        }
        else {
            return s;
        }
    },
    render: function () {
        var view = this;
        var attributes = view.model.attributes;

        if (attributes.am_cert_hash) {
            _.each(attributes.am_cert_hash, function (hash, index) {
                hash.abbrev = view.shorten(hash.value, 8);
            });
        }

        if (attributes.md5sum) {
            _.each(attributes.md5sum, function (md5, index) {
                md5.abbrev = view.shorten(md5.value, 8);
            });
        }

        var data = {
            keys: view.keys,
            facets: attributes,
            get_facet_values: function (facet) {
                return this.facets[facet];
            },
            get_facet_count: function (facet) {
                return this.facets[facet].length;
            },
            get_facet_title: function (facet) {
                var title = view.titles[facet];
                return title ? title : facet;
            },
            get_facet_icon: function (facet) {
                var icon = view.icons[facet];
                return icon ? icon : 'fa-meh';
            },
            get_visibility: function (facet) {
                if (view.model.params[facet] && view.model.params[facet].length > 0) {
                    return true;
                }
                else {
                    return false;
                }
            }
        };

        view.undelegateEvents();

        // Render the template.
        view.$el.html(_.template($("#hits-facets-template").html(), data));

        view.delegateEvents({
            'click li a': 'on_click',
            'click #reset-facets': 'reset_facets',
            'click #refresh-facets': 'refresh_facets'
        });
    },
    on_click: function (ev) {
        var view = this;
        var attributes = ev.currentTarget.attributes;
        var facet_type = attributes['data-facet-type'].value;
        var facet_id = attributes['data-facet-id'].value;
        if (facet_type && facet_id) {
            log.debug(_.sprintf('Facet selected: %s, %s', facet_type, facet_id));
            if (view.criteria.is_param(facet_type, facet_id)) {
                view.criteria.remove(facet_type, facet_id);
            }
            else {
                view.criteria.add(facet_type, facet_id);
            }

            view.load_facets();

            // Bubble a selected event.
            view.trigger('selected', facet_type, facet_id);
        }
        else {
            // Error
            StrikeFinder.display_error('Error: anchor does not have facet attributes defined.');
        }
    },
    /**
     * User reset the filter criteria.
     */
    reset_facets: function () {
        var view = this;
        view.criteria.reset();

        view.load_facets();

        // Bubble a reset event.
        view.trigger('reset');
    },
    get_criteria: function () {
        return this.criteria;
    },
    /**
     * Load the hits facets based on the views criteria.
     */
    load_facets: function () {
        var view = this;
        view.model.params = view.criteria.attributes;
        StrikeFinder.block_element(view.$el);
        view.model.fetch({
            error: function (model, response, options) {
                if (response.statusCode == 404) {
                    StrikeFinder.display_error('Not hits found for criteria: ' + JSON.stringify(view.criteria.attributes));
                }
            }
        });

        view.trigger('refresh', view.criteria.attributes);
    },
    fetch: function (params) {
        log.info('Reloading the hits facets view...');

        if (params) {
            // Set the initial params on the hits criteria.  These params will survive a reset.
            this.criteria.set_initial(params);
        }

        this.load_facets();
    }
});
