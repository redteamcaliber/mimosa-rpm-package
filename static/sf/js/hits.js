var StrikeFinder = StrikeFinder || {};

/**
 * Hits table view.
 */
StrikeFinder.HitsTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            title: '&nbsp;',
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

        view.listenTo(view, 'load', function () {
            // Select the first row.
            view.select_row(0);
        });
        view.listenTo(view, 'click', function (row, ev) {
            var position = view.get_absolute_index(ev.currentTarget);

            var title;
            if (position !== undefined) {
                title = _.sprintf('<i class="icon-list"></i> Hits (%s of %s)', position + 1, view.get_total_rows());
            }
            else {
                title = _.sprintf('<i class="icon-list"></i> Hits (%s)', view.get_total_rows());
            }
            // Update the title with the count of the rows.
            view.hits_collapsable.set('title', title);
        });

        view.options.sDom = 'Rl<"sf-table-wrapper"t>ip';
        view.options.iDisplayLength = 100;
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

        this.$el.css('margin-bottom', '20px');
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
                log.error('Unable to find IOC definition: ' + ioc_definition_list.length);
                console.dir(ioc_definition_list);
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
                    view.$(selected_path_item).show();
                    // Mark the item as highlighted so it's not hidden.
                    view.$(selected_path_item).addClass('highlighted');
                });

                // Highlight the item.
                selected_element.find('> span.ioc-rule').css({'background': '#FFF79A', 'font-weight': 'bold'});
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

        StrikeFinder.block_element(this.$el);
        this.collection.fetch();
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

        view.$el.html(_.unescape(view.model.get('content')));

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
                //console.dir(el);

                // TODO: Clean this up.
                // Try and get the element the user clicked on.
                if (el && el.baseNode && el.baseNode.parentElement) {
                    var span = el.baseNode.parentElement;
                    if (span && $(span).hasClass('ioc-term')) {
                        var ioc_term = $(span).attr('ioc-term');
                        if (ioc_term) {
                            // The user clicked on an IOC term span.
                            log.debug('ioc-term: ' + ioc_term);
                            view.ioc_term = ioc_term;
                            view.$('#ioc-term-item').text(ioc_term);
                            view.$('#auto-suppress-item').css('display', 'block');
                        }
                        else {
                            view.$('#auto-suppress-item').css('display', 'none');
                        }
                    }
                    else {
                        view.$('#auto-suppress-item').css('display', 'none');
                    }
                }
                else {
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
            view.model.set('tagname', view.$("#tagname").val());
            view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
            view.model.set('condition', view.$("#condition").val());
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

                StrikeFinder.wait_for(
                    function (callback) {
                        // Check task result.
                        var task = new StrikeFinder.Task({id: task_id});
                        task.fetch({
                            success: function (model, response, options) {
                                if (response.state == 'SUCCESS') {
                                    // The task was completed successfully.
                                    var success_message = 'Successfully tagged %s hit(s) with for: %s';
                                    StrikeFinder.display_success(_.sprintf(success_message,
                                        response.result.summary, view.model.as_string()));

                                    // Notify that the mass tag was created.
                                    view.trigger('create', view.model);

                                    // Hide the form.
                                    view.$("#mass-tag-form").modal("hide");
                                    StrikeFinder.unblock(form);

                                    // Done.
                                    callback(true);
                                }
                                else {
                                    // Not done.
                                    callback(false);
                                }
                            },
                            error: function () {
                                // Error.
                                StrikeFinder.display_error('Error while checking task status.');

                                // Unblock the UI.
                                StrikeFinder.unblock(form);

                                // Done.
                                callback(true);
                            }
                        });
                    },
                    function (completed) {
                        if (!completed) {
                            var task_message = _.sprintf('The task for mass tag: %s is still running and ' +
                                'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                view.model.as_string());
                            StrikeFinder.display_info(task_message);

                            // Hide the form.
                            view.$("#mass-tag-form").modal("hide");
                            StrikeFinder.unblock(form);
                        }
                    }
                );
            },
            error: function () {
                StrikeFinder.unblock(form);
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
        var form = $('#suppression-form');
        try {
            StrikeFinder.block_element(form, 'Processing...');

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
        }
        finally {
            StrikeFinder.unblock(form);
        }

        StrikeFinder.block_element(form, 'Processing...');
        view.model.save({}, {
            success: function (model, response, options) {
                var submit_message = _.sprintf('Submitted task for suppression: %s',
                    view.model.as_string());
                StrikeFinder.display_success(submit_message);

                StrikeFinder.wait_for(
                    function (callback) {
                        // Check task result.
                        var task = new StrikeFinder.Task({id: response.task_id});
                        task.fetch({
                            success: function (model, response, options) {
                                if (response.state == 'SUCCESS') {
                                    // The task was completed successfully.
                                    var success_message = 'Successfully suppressed %s hit(s) with suppression: %s';
                                    StrikeFinder.display_success(_.sprintf(success_message,
                                        response.result.summary, view.model.as_string()));

                                    // Notify that a suppression was created.
                                    view.trigger('create', view.model);

                                    // Hide the form.
                                    view.$("#suppression-form").modal("hide");
                                    StrikeFinder.unblock(form);

                                    // Done.
                                    callback(true);
                                }
                                else {
                                    // Not done.
                                    callback(false);
                                }
                            },
                            error: function () {
                                // Error.
                                StrikeFinder.display_error('Error while checking task status.');
                                StrikeFinder.unblock(form);
                                // Done.
                                callback(true);
                            }
                        });
                    },
                    function (completed) {
                        if (!completed) {
                            var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                view.model.as_string());
                            StrikeFinder.display_info(task_message);

                            // Hide the form.
                            view.$("#suppression-form").modal("hide");
                            StrikeFinder.unblock(form);
                        }
                    }
                );
            },
            error: function () {
                try {
                    StrikeFinder.display_error('Error while submitting suppression task.');
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
                ],
                aoColumnDefs: [
                    {
                        mRender: function (data, type, row) {
                            return StrikeFinder.format_date_string(data);
                        },
                        aTargets: [0]
                    }
                ]
            });
            view.comments_table.render();
        });

        return this;
    },
    fetch: function (rowitem_uuid) {
        var view = this;

        if (rowitem_uuid) {
            view.collection.rowitem_uuid = rowitem_uuid;
        }

        StrikeFinder.block_element(view.$el);
        view.collection.fetch({
            success: function () {
                StrikeFinder.unblock(view.$el);
            },
            error: function () {
                StrikeFinder.unblock(view.$el);
            }
        });
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
    },
    fetch: function (rowitem_uuid) {
        if (rowitem_uuid) {
            // Don't actually re-fetch the tags but update the row id.
            this.rowitem_uuid = rowitem_uuid;
        }
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
            view.ioc_tabs_view = new StrikeFinder.IOCTabsView({
                el: '#iocs-div'
            });

            // File info view.
            view.audit_view = new StrikeFinder.AuditView({
                el: $("#audit-div")
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
                view.trigger('create:masstag    ', view.row, model);
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
                    cluster_uuid: view.row.cluster_uuid
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
                    rowitem_type: view.row.rowitem_type
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
                        success: function (model, response, options) {
                            // The task has been submitted for the suppression.
                            var submit_message = _.sprintf('Submitted task for suppression: %s',
                                suppression_model.as_string());
                            StrikeFinder.display_success(submit_message);

                            // Try and wait for the task result.
                            StrikeFinder.wait_for(
                                function (callback) {
                                    // Check task result.
                                    var task = new StrikeFinder.Task({id: response.task_id});
                                    task.fetch({
                                        success: function (model, response, options) {
                                            // Examine the current task result.

                                            if (response.state == 'SUCCESS') {
                                                // The task was completed successfully.
                                                var msg = _.sprintf('Successfully suppressed %s hits for %s',
                                                    response.result.summary, suppression_model.as_string());
                                                StrikeFinder.display_success(msg);

                                                // Notify that a suppression was created.
                                                view.trigger('create:suppression', view.row, suppression_model);

                                                // Unblock the UI.
                                                StrikeFinder.unblock();

                                                // Done.
                                                callback(true);
                                            }
                                            else {
                                                // The task has not completed yet.
                                                callback(false);
                                            }
                                        },
                                        error: function () {
                                            // Error.
                                            StrikeFinder.display_error('Error while checking task status.');
                                            // Unblock the UI.
                                            StrikeFinder.unblock();
                                            // Done.
                                            callback(true);
                                        }
                                    });
                                },
                                function (complete) {
                                    if (!complete) {
                                        // The task did not complete and is running in the background.
                                        var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                            'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                            suppression_model.as_string());
                                        StrikeFinder.display_info(task_message);
                                        // Unblock the UI.
                                        StrikeFinder.unblock();
                                    }
                                }
                            );
                        },
                        error: function () {
                            try {
                                // Error submitting the task.
                                StrikeFinder.display_error("Error while auto creating suppression.");
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
    },
    fetch: function () {
        var view = this;

        // Update the child views with the current row's parameters.
        view.agenthost_view.fetch(view.row.am_cert_hash);
        view.ioc_tabs_view.fetch(view.row.uuid);
        view.audit_view.fetch(view.row.uuid);
        view.comments_view.fetch(view.row.uuid);
        if (view.tags_view) {
            // There are cases where the tags_view is not create/enabled.
            view.tags_view.fetch(view.row.uuid);
        }

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
            el: '#hits-details-div',
            hits_table_view: view.hits_table_view
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
    },
    fetch: function (params) {
        var view = this;

        if (params) {
            view.params = params;
        }

        log.debug(_.sprintf('Rendering hits view with params: %s', JSON.stringify(view.params)));

        // Check whether enough parameters have been passed to render the hits view.
        var is_exp_key_defined = view.params.services && view.params.services.length > 0 && view.params.clusters &&
            view.params.clusters.length > 0 && view.params.exp_key;

        if (!is_exp_key_defined) {
            // Not enough parameters have been supplied, try loading from the server.

            log.debug('Parameters not satisfied, attempting to load from the server.');
            view.params = {
                services: StrikeFinder.usersettings.services,
                clusters: StrikeFinder.usersettings.clusters,
                exp_key: StrikeFinder.usersettings.exp_key[0],
                usertoken: StrikeFinder.usersettings.usertoken
            };

            log.debug('Loaded user settings: ' + JSON.stringify(view.params));

            if (view.params.services && view.params.services.length > 0 && view.params.clusters &&
                view.params.clusters.length > 0 && (view.params.exp_key || view.params.usertoken)) {

                // Enough data was found from a previous checkout to display the view.
                view.fetch_callback();
            }
            else {
                // Not enough data to render the hits view, navigate to the shopping view.
                // TODO: Disable the hits link for this case instead.
                alert('You must select shopping criteria before viewing hits.');
                window.location = '/sf/';
            }
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

        view.hits_details_view.exp_key = view.params.exp_key;

        if (view.params.usertoken) {
            StrikeFinder.run(function () {
                var usertoken_params = {
                    usertoken: view.params.usertoken
                };
                log.debug('Fetching hits with params: ' + JSON.stringify(usertoken_params));
                view.hits_table_view.fetch(usertoken_params);
            });
        }
        else {
            StrikeFinder.run(function () {
                var exp_key_params = {
                    services: view.params.services,
                    clusters: view.params.clusters,
                    exp_key: view.params.exp_key
                };
                log.debug('Fetching hits with params: ' + JSON.stringify(exp_key_params));
                view.hits_table_view.fetch(exp_key_params);
            });
        }

        // Refresh the hits view based on the current expression.
        view.suppressions_table.fetch(view.params.exp_key);
    }
});
