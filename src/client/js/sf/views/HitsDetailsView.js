define(function (require) {
    var async = require('async');
    var Marionette = require('marionette');
    var highlighter = require('highlighter');

    var iocviewer = require('iocviewer');
    var uac_utils = require('uac/common/utils');
    var FetchController = require('uac/controllers/FetchController');
    var Evented = require('uac/common/mixins/Evented');
    var vent = require('uac/common/vent');
    var TableView = require('uac/views/TableView');
    var CollapsableView = require('uac/views/CollapsableView');
    var CollapsableContentView = require('uac/views/CollapsableContentView');
    var TableViewControls = require('uac/views/TableViewControls');

    var StrikeFinderEvents = require('sf/common/StrikeFinderEvents');
    var HitsLinkView = require('sf/views/HitsLinkView');
    var MergeView = require('sf/views/MergeView');
    var SuppressionFormView = require('sf/views/SuppressionFormView');
    var AcquireFormView = require('sf/views/AcquireFormView');
    var MassTagFormView = require('sf/views/MassTagFormView');
    var SuppressionsTableView = require('sf/views/SuppressionsTableView');
    var AgentTasksTableView = require('sf/views/AgentTasksTableView');

    var MD5ModelView = require('sf/views/MD5ModalView');

    var AgentTaskCollection = require('sf/models/AgentTaskCollection');
    var TagView = require('sf/views/TagView');
    var IOCCollection = require('sf/models/IOCCollection');
    var AgentHostModel = require('sf/models/AgentHostModel');
    var AuditModel = require('sf/models/AuditModel');
    var SuppressionModel = require('sf/models/SuppressionModel');
    var TagCollection = require('sf/models/TagCollection');
    var SetTagModel = require('sf/models/SetTagModel');
    var SuppressionListItemCollection = require('sf/models/SuppressionListItemCollection');
    var CommentsCollection = require('sf/models/CommentsCollection');
    var CommentsModel = require('sf/models/CommentsModel');


    var sf_utils = require('sf/common/utils');
    var templates = require('sf/ejs/templates');


    var IdentitiesView = Marionette.ItemView.extend({
        className: 'btn-group',
        template: templates['identities.ejs'],
        initialize: function (options) {
            this.options = options;
        },
        events: {
            'click .dropdown-menu > li > a': 'on_click'
        },
        onRender: function () {
            var view = this;

            // Get the drop down menu.
            var menu = view.$('.dropdown-menu');
            // Remove any child elements.
            menu.empty();

            var uuid = view.model.get('uuid');
            var identical_hits = view.model.get('identical_hits');
            var selected = undefined;

            // Debug
            console.log('Found ' + identical_hits.length + ' identical hits for row: ' + uuid);

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
            return _.sprintf('%s %s %s %s %s', uac_utils.format_date_string(created), tag_string, target_string, selected_string, caret_string);
        },
        on_click: function (ev) {
            var view = this;
            // Get the selected uuid.
            var selected_uuid = $(ev.currentTarget).attr('name');

            if (selected_uuid != view.model.get('uuid')) {
                // Debug
                console.log('Selected identity: ' + selected_uuid);
                // Trigger an event that the row uuid was selected.
                view.trigger('click', selected_uuid);
                vent.trigger(StrikeFinderEvents.SF_IDENTITY_SELECT, selected_uuid);
            }
        }
    });

    var MergeAllView = Marionette.ItemView.extend({
        tagName: 'button',
        className: 'btn btn-link',
        template: templates['merge-all.ejs'],
        events: {
            'click': 'on_click'
        },
        initialize: function () {
            this.$el.hide();
        },
        onRender: function () {
            var view = this;

            var current_uuid = view.model.get('uuid');
            var identical_hits = view.model.get('identical_hits');

            if (identical_hits && identical_hits.length == 1) {
                // There is only a single identity.
                this.$el.prop('disabled', true);
                this.$el.show();
            }
            else {
                // There are multiple identities.
                if (current_uuid == identical_hits[0].uuid) {
                    // The current identity is the most recent, enable merge all.
                    this.$el.prop('disabled', false);
                    this.$el.show();
                }
                else {
                    // The current identity is not the most recent.
                    this.$el.prop('disabled', true);
                    this.$el.hide();
                }
            }
        },
        //
        // Handle the click of the merge all button.
        //
        on_click: function () {
            var view = this;
            var uuid = view.model.get('uuid');
            var merge_model = new Backbone.Model();
            merge_model.url = '/sf/api/hits/' + uuid + '/mergeall';

            uac_utils.block();
            merge_model.save({}, {
                success: function (model, response) {
                    try {
                        console.log(_.sprintf('Merged all identities for uuid: %s', uuid));
                        uac_utils.display_success('Successfully merged all identities.');

                        // Notify that a merge has taken place.
                        view.trigger('mergeall', uuid, response.uuid);
                        vent.trigger(StrikeFinderEvents.SF_MERGE_ALL, response.uuid);
                    }
                    finally {
                        uac_utils.unblock();
                    }
                },
                error: function () {
                    // Error.
                    uac_utils.unblock();
                    uac_utils.display_error('Error while performing mergeall.');
                }
            });
        }
    });

    /**
     * Agent host view.
     */
    var AgentHostView = Marionette.ItemView.extend({
        template: templates['agent-host.ejs'],
        attributes: function () {
            return this.model ? this.model.attributes : null;
        }
    });

    //
    // View to indicate the host was not found in Seasick.
    //
    var AgentHostMissingView = Marionette.ItemView.extend({
        template: templates['agent-host-empty.ejs']
    });

    //
    // View to indicate that there was an error retrieving the host.
    //
    var AgentHostErrorView = Marionette.ItemView.extend({
        template: templates['agent-host-error.ejs']
    });

    /**
     * View for displaying context menu in the audit view.
     */
    var AuditContextMenuView = Marionette.ItemView.extend({
        template: templates['audit-context-menu.ejs'],

        initialize: function (options) {
            this.source = options.source;

            this.is_suppress = true;
            if ('suppress' in options && options['suppress'] === false) {
                this.is_suppress = false;
            }
            this.is_acquire = true;
            if ('acquire' in options && options['acquire'] === false) {
                this.is_acquire = false;
            }
            this.is_masstag = true;
            if ('masstag' in options && options['masstag'] === false) {
                this.is_masstag = false;
            }
        },
        events: {
            "click #suppress-item": "suppress",
            "click #auto-suppress-item": "auto_suppress",
            "click #acquire-item": "acquire",
            "click #tag-item": "tag",
            'click #close-item': 'cancel'
        },
        serializeData: function () {
            return {
                is_suppress: this.is_suppress,
                is_acquire: this.is_acquire,
                is_masstag: this.is_masstag
            };
        },
        onRender: function () {
            var view = this;

            $(view.source).highlighter({
                complete: function (selection, el) {
                    // TODO: Clean this up.

                    var child_elements;

                    // Try and get the element the user clicked on.
                    if (el && el.anchorNode && el.anchorNode.parentElement) {

                        var span = el.anchorNode.parentElement;
                        if (span && $(span).hasClass('ioc-term')) {
                            // The user clicked on an IOC term span.
                            var term1 = $(span).attr('ioc-term');
                            console.log('ioc-term: ' + term1);
                            view.ioc_term = term1;
                            view.$('#ioc-term-item').text(term1);
                            view.$('#auto-suppress-item').css('display', 'block');
                        }
                        else if ((child_elements = $(el.anchorNode).find('.ioc-term')) && child_elements.length == 1) {
                            // The user clicked an IOC term.
                            var term2 = child_elements.attr('ioc-term');
                            console.log('ioc-term: ' + term2);
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
        },
        suppress: function () {
            this.trigger("suppress", this.selection, this.ioc_term);
            vent.trigger(StrikeFinderEvents.SF_SUPPRESS_ACTION, {
                ioc_term: this.ioc_term,
                selection: this.selection
            });
            this.$el.parent().hide();
        },
        auto_suppress: function () {
            this.trigger("auto-suppress", this.selection, this.ioc_term);
            vent.trigger(StrikeFinderEvents.SF_AUTO_SUPPRESS_ACTION, {
                ioc_term: this.ioc_term,
                selection: this.selection
            });
            this.$el.parent().hide();
        },
        acquire: function () {
            console.info('Firing acquire action...');
            this.trigger("acquire", this.selection);
            vent.trigger(StrikeFinderEvents.SF_ACQUIRE_ACTION, {
                selection: this.selection
            });
            this.$el.parent().hide();
        },
        tag: function (ev) {
            this.trigger('tag', this.selection, this.ioc_term);
            vent.trigger(StrikeFinderEvents.SF_MASS_TAG_ACTION, {
                ioc_term: this.ioc_term,
                selection: this.selection
            });
            this.$el.parent().hide();
        },
        cancel: function () {
            this.$el.parent().hide();
        },
        onBeforeClose: function () {
            $(this.source).highlighter('destroy');
        }
    });

    /**
     * Audit content details view.
     */
    var AuditView = Marionette.View.extend({
        render: function () {
            var view = this;

            view.$el.html(view.model.get('content'));

            view.delegateEvents({
                'click .md5-view': 'on_click_md5'
            });

            uac_utils.collapse(view.el);

            return this;
        },
        on_click_md5: function (ev) {
            ev.preventDefault();

            if (this.md5_dialog) {
                this.md5_dialog.close();
            }
            this.md5_dialog = new MD5ModelView({
                model: new Backbone.Model($(ev.currentTarget).data().md5)
            });
            $('#dialog-div').append(this.md5_dialog.render().el);
            this.md5_dialog.modal()

            return false;
        }
    });

    /**
     * Tabbed view of IOC's.
     */
    var IOCTabsView = Marionette.Layout.extend({
        template: templates['ioc-tabs.ejs'],

        initialize: function (options) {
            var view = this;
            view.options = options;

            // Filter by default.
            view.filtered = true;

            // Initialize a map of tables to expression keys.
            view.suppressions_table_map = {};
        },
        serializeData: function () {
            return {
                items: this.collection.toJSON(),
                get_active_class: function (index) {
                    if (index == 0) {
                        return "active";
                    }
                    else {
                        return "";
                    }
                }
            };
        },
        onRender: function () {
            var view = this;

            // Run the IOC viewer on all the pre-formatted elements.
            view.$('pre').iocViewer();

            view.delegateEvents({
                'click #ioc-filter-button': 'on_click',
                'shown.bs.tab a[data-toggle="tab"]': 'on_shown'
            });

            // Filter by default.
            view.filter();

            return view;

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
                    console.error('Unable to find IOC definition: ' + ioc_definition_list.length);
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
                        console.error('Unable to find selected element for selector: ' + selected_id_selector);
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
                        .css({
                            'background': '#FFF79A',
                            'font-weight': 'bold',
                            color: '#33311e'
                        });
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
                console.log('ioc_tab_selection: ' + ioc_tab_selector);
                var ioc_tab_element = view.$el.find(ioc_tab_selector);

                // Find the root IOC definition.
                var ioc_definition_list = ioc_tab_element.find('.ioc-definition');
                if (ioc_definition_list.length != 1) {
                    console.error('Unable to find IOC definition.');
                }
                // Display the children and remove any previous formatting.
                ioc_definition_list.find('*').show();
                //ioc_definition_list.find('*').removeClass('uac-opaque').removeClass('highlighted');
            });
        },
        get_region_name: function (exp_key) {
            return 'suppressions-list-' + exp_key + '-region';
        },
        /**
         * Handler for an IOC tab being selected.
         * @param ev - the related event.
         */
        on_shown: function (ev) {
            var view = this;
            var exp_key = ev.target.name;

            console.log('Selected IOC with exp_key: ' + exp_key);
            view.trigger('ioc:selected', exp_key);
            vent.trigger(StrikeFinderEvents.SF_IOC_TAB_SELECT, exp_key);

            if (!_.has(view.suppressions_table_map, exp_key)) {
                // Initialize the suppressions table for the expression.
                console.log('Initializing suppressions table for exp_key: ' + exp_key);

                // Create a region to ensure the view is cleanup.
                var region_name = view.get_region_name(exp_key);
                var region = view.addRegion(region_name, '#' + region_name);

                var suppressions = new SuppressionListItemCollection();
                suppressions.exp_key = exp_key;

                collapsable = new CollapsableView({
                    title: '<i class="fa fa-level-down"></i> Suppressions',
                    collapsed: true
                });
                region.show(collapsable);

                new FetchController({
                    collection: suppressions,
                    region: region.el
                })
                    .fetch({
                        success: function() {
                            // Create a suppressions table view to render to the view.
                            var suppressions_table = new SuppressionsTableView({
                                condensed: true,
                                collection: suppressions
                            });
                            collapsable.listenToOnce(suppressions_table, 'load', function () {
                                // Update the collapsable title.
                                collapsable.set_title(_.sprintf('<i class="fa fa-level-down"></i> Suppressions (%d)', suppressions.length));
                            });
                            collapsable.show(suppressions_table);
                        }
                    });
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
            //console.log('Path: ' + path);
            return results;
        }
    });

    var CommentsTableView = TableView.extend({
        initialize: function (options) {
            var view = this;

            // Call the super initialize.
            view.constructor.__super__.initialize.apply(this, arguments);

            view.options.iDisplayLength = -1;
            view.options.aoColumns = [
                {
                    sTitle: "Created",
                    mData: "created",
                    sWidth: "20%",
                    bSortable: true
                },
                {
                    sTitle: "Comment",
                    mData: "comment",
                    sWidth: "60%",
                    bSortable: true,
                    sClass: 'wrap'
                },
                {
                    sTitle: "User",
                    mData: "user_uuid",
                    sWidth: "20%",
                    bSortable: true
                }
            ];
            view.options.aaSorting = [
                [0, "desc"]
            ];
            view.options.aoColumnDefs = [
                {
                    mRender: function (data, type, row) {
                        return uac_utils.format_date_string(data);
                    },
                    aTargets: [0]
                }
            ];
            view.options.oLanguage = {
                sEmptyTable: 'No comments have been entered'
            };

            view.listenTo(view, 'row:created', function (row) {
                view.escape_cell(row, 1);
            });

            view.options.iDisplayLength = 10;
            view.options.sDom = 'lftip';
        }
    });

    /**
     * View to display and create comments.
     */
    var CommentsView = Marionette.Layout.extend({
        template: templates['comments.ejs'],
        events: {
            "click button": "add_comment",
            "keyup #comment": "on_keyup"
        },
        regions: {
            comments_table_region: '.comments-table-region'
        },
        initialize: function (options) {
            if (options.rowitem_uuid) {
                this.rowitem_uuid = options.rowitem_uuid;
            }
        },
        onShow: function () {
            var view = this;

            view.comments_table = new CommentsTableView({
                collection: view.collection
            });
            view.comments_table_region.show(view.comments_table);
        },
        length: function () {
            if (this.comments_table) {
                return this.comments_table.get_total_rows();
            }
            else {
                return 0;
            }
        },
        hide: function () {
            this.$el.hide();
        },
        show: function () {
            this.$el.show();
        },
        add_comment: function () {
            var view = this;
            var comment = view.$("#comment").val();
            if (!comment || comment.trim() == "") {
                console.warn('No comment value found.');
                return;
            }

            console.debug("Creating comment for rowitem_uuid: " + view.rowitem_uuid);

            var new_comment = new CommentsModel({
                comment: comment,
                rowitem_uuid: view.rowitem_uuid
            });

            console.debug('Comment rowitem_uuid: ' + new_comment.get('rowitem_uuid'));

            uac_utils.block_element(view.$el);
            new_comment.save([], {
                async: false,
                success: function (model, response, options) {
                    uac_utils.unblock(view.$el);

                    $("#comment").val("");
                    view.comments_table.fetch();
                },
                error: function (model, response) {
                    // Error
                    uac_utils.unblock(view.$el);
                    uac_utils.display_response_error('Error while creating new comment.', response);
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
    var HitsDetailsView = Marionette.Layout.extend({
        template: templates['hits-details.ejs'],

        regions: {
            agent_host_region: '#agent-host-region',
            audit_content_region: '#audit-content-region',
            audit_region: '#audit-region',
            audit_type_region: '#audit-type-region',
            comments_region: '#comments-region',
            link_region: '#link-region',
            hits_dialog_region: '#hits-dialog-region',
            identities_region: '#identities-region',
            ioc_tabs_region: '#ioc-tabs-region',
            merge_all_region: '#merge-all-region',
            merge_region: '#merge-region',
            prev_next_region: '#prev-next-div',
            tags_region: '#tags-region',
            tasks_region: '#tasks-region'
        },

        initialize: function (options) {
            if (!options.hits_table_view && !options.hits_table_name) {
                // Error, table parameter is required.
                throw new Error('"hits_table_view" or "hits_table_name" parameter is required.');
            }

            var view = this;
            view.options = options;

            view.hits_table_view = view.options.hits_table_view;
            view.hits_table_name = view.options.hits_table_name;

            if (options && options.auto_render) {
                view.auto_render = options.auto_render;
            }
            else {
                view.auto_render = true;
            }

            if (view.auto_render && view.hits_table_view) {
                // Listen for changes to a table view instance.
                view.listenTo(view.hits_table_view, 'click', view.render_details);

                // Hide all of the details views when the hits table is empty.
                view.listenTo(view.hits_table_view, 'empty', function () {
                    // Hide all components with the details view class.
                    $('.sf-details-view').fadeOut().hide();
                });
            }
            if (view.auto_render && view.hits_table_name) {
                // Listen globally to table view.
                view.registerAsync({
                    constructorName: 'TableView',
                    instanceName: view.hits_table_name,
                    eventName: 'click',
                    handler: view.render_details
                });
                view.registerAsync({
                    constructorName: 'TableView',
                    instanceName: view.hits_table_name,
                    eventName: 'empty',
                    handler: function () {
                        // Hide all components with the details view class.
                        $('.sf-details-view').fadeOut().hide();
                    }
                });
            }

            view.listenTo(vent, StrikeFinderEvents.SF_MERGE, function (source_uuid, dest_uuid) {
                view.handle_merge(dest_uuid);
            });

            view.listenTo(vent, StrikeFinderEvents.SF_MERGE_ALL, function (uuid) {
                view.handle_merge(uuid);
            });

            view.listenTo(vent, StrikeFinderEvents.SF_SUPPRESS_ACTION, function (params) {
                console.log(_.sprintf('Creating suppression for text: %s, rowitem_type: %s, and term: %s',
                    params.selection, view.row.rowitem_type, params.ioc_term));

                var options = {
                    itemvalue: params.selection,
                    rowitem_uuid: view.row.uuid,
                    rowitem_type: view.row.rowitem_type,
                    exp_key: view.exp_key,
                    cluster_uuid: view.row.cluster_uuid,
                    iocs: view.iocs.toJSON()
                };

                if (params.ioc_term) {
                    options.itemkey = params.ioc_term;
                }

                var suppression_form_view = new SuppressionFormView(options);

                view.hits_dialog_region.show(suppression_form_view);
            });

            view.listenTo(vent, StrikeFinderEvents.SF_ACQUIRE_ACTION, function (params) {
                console.info('Initiating acquisition for selection: ' + params.selection);

                var acquire_form_view = new AcquireFormView({
                    el: '#dialog-div'
                });

                var cluster = view.host.attributes.cluster;
                var cluster_uuid = undefined;
                if (cluster && cluster.uuid) {
                    cluster_uuid = cluster.uuid;
                }
                else {
                    cluster_uuid = view.row.cluster_uuid;
                }
                acquire_form_view.render({
                    identity: view.row.identity,
                    selection: params.selection,
                    am_cert_hash: view.row.am_cert_hash,
                    cluster_uuid: cluster_uuid,
                    cluster_name: view.row.cluster_name,
                    rowitem_uuid: view.row.uuid
                });
            });

            view.listenTo(vent, StrikeFinderEvents.SF_MASS_TAG_ACTION, function (params) {
                // Display the mass tag dialog.
                var mass_tag_form = new MassTagFormView({
                    el: '#dialog-div'
                });

                mass_tag_form.render({
                    itemvalue: params.selection,
                    itemkey: params.ioc_term,
                    exp_key: view.exp_key,
                    am_cert_hash: view.row.am_cert_hash,
                    cluster_uuid: view.row.cluster_uuid,
                    rowitem_uuid: view.row.rowitem_uuid,
                    rowitem_type: view.row.rowitem_type,
                    iocs: view.iocs
                });
            });

            view.listenTo(vent, StrikeFinderEvents.SF_AUTO_SUPPRESS_ACTION, function (params) {
                // Auto create a suppression.
                var suppression_model = new SuppressionModel({
                    itemvalue: params.selection,
                    rowitem_type: view.row.rowitem_type,
                    exp_key: view.exp_key,
                    cluster_uuid: view.row.cluster_uuid,
                    comment: params.selection,
                    condition: 'is',
                    itemkey: params.ioc_term,
                    preservecase: false
                });
                // Validate the model before saving.
                if (!suppression_model.isValid()) {
                    // Error
                    errors = view.model.validationError;
                    _.each(errors, function (error) {
                        uac_utils.display_error(error);
                    });
                }
                else {
                    // Ok.
                    uac_utils.block();

                    suppression_model.save({}, {
                        success: function (model, response) {
                            // The task has been submitted for the suppression.
                            var submit_message = _.sprintf('Submitted task for suppression: %s',
                                suppression_model.as_string());

                            uac_utils.display_success(submit_message);

                            // Try and wait for the task result.
                            sf_utils.wait_for_task(response.task_id, function (err, completed, response) {
                                uac_utils.unblock();

                                if (err) {
                                    // Error checking the task result.
                                    uac_utils.display_error(err);
                                }
                                else if (completed) {
                                    // The task was completed successfully.
                                    var msg = _.sprintf('Successfully suppressed %s hits for %s',
                                        response.result.summary, suppression_model.as_string());
                                    uac_utils.display_success(msg);

                                    // Notify that a suppression was created.
                                    vent.trigger(StrikeFinderEvents.SF_SUPPRESS_CREATE, view.row, suppression_model);
                                }
                                else {
                                    // The task did not complete and is running in the background.
                                    var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                            'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                        suppression_model.as_string());
                                    uac_utils.display_info(task_message);
                                }
                            });
                        },
                        error: function (model, response) {
                            try {
                                uac_utils.display_response_error('Error while submitting auto suppression task.', response);
                            }
                            finally {
                                uac_utils.unblock();
                            }
                        }
                    });
                }
            });
        },

        render_link_details: function (identity) {
            var link_view = new HitsLinkView({
                model: new Backbone.Model({
                    identity: identity
                })
            });
            this.link_region.show(link_view);
        },

        render_host_details: function (am_cert_hash) {
            var view = this;

            view.host = new AgentHostModel({
                hash: am_cert_hash
            });
            var agenthost_view = new AgentHostView({
                model: view.host
            });

            new FetchController({
                model: view.host,
                view: agenthost_view,
                region: view.agent_host_region
            })
                .fetch({
                    error: function (model, response) {
                        if (response.status == 200) {
                            // Indicate that the host was not found.
                            var missing_view = new AgentHostMissingView({
                                model: view.host
                            });
                            view.agent_host_region.show(missing_view);
                        }
                        else {
                            // Display an error, could not retrieve the host data.
                            var error_view = new AgentHostErrorView({
                                model: view.host
                            });
                            view.agent_host_region.show(error_view);
                        }
                    }
                });
        },

        render_audit_details: function (rowitem_uuid) {
            var view = this;

            var audit = new AuditModel({
                uuid: rowitem_uuid
            });

            // Initialized the audit view.
            var audit_view = new AuditView({
                model: audit
            });

            // Initialize the identities view.
            var identities_view = new IdentitiesView({
                model: audit
            });
            view.listenTo(identities_view, 'click', function (rowitem_uuid) {
                // Re-display the row item data.
                view.render_rowitem(rowitem_uuid);
            });

            // Initialized the tags view.
            var tagging_enabled = !'tag' in view.options || view.options.tag !== false;
            var tags = new TagCollection();
            // Display the tags view unless explicitly disabled.
            var tags_view = new TagView({
                collection: tags,
                model: audit,
                disabled: !tagging_enabled
            });
            if (tagging_enabled) {
                // Only listen to create events if tagging is enabled.
                view.listenTo(vent, StrikeFinderEvents.SF_TAG_CREATE, function (params) {
                    // Reload the details view.
                    view.render_rowitem(params.rowitem_uuid);
                });
            }
            sf_utils.get_tags(function (err, tag_values) {
                if (err) {
                    // Error.
                    uac_utils.display_error('Exception while loading tags: ' + err);
                }
                else {
                    tags.reset(tag_values);
                }
            });

            // Initialize the merge all view.
            var merge_all_view = new MergeAllView({
                model: audit
            });

            // Initialized the merge view.
            var merge_view = new MergeView({
                model: audit
            });

            // Fetch the audit and display the related views.
            new FetchController({
                model: audit,
                region: view.audit_content_region
            })
                .fetch({
                    success: function() {
                        view.audit_region.show(audit_view);
                        view.tags_region.show(tags_view);
                        view.merge_all_region.show(merge_all_view);
                        view.merge_region.show(merge_view);
                        view.identities_region.show(identities_view);

                        // Update the audit type.
                        view.$(view.audit_type_region.el).html(audit.get('rowitem_type'));
                    }
                });
        },

        //
        // Display the IOC tabs.
        //
        render_ioc_details: function (rowitem_uuid) {
            console.trace();

            var view = this;
            view.iocs = new IOCCollection();
            view.iocs.rowitem_uuid = rowitem_uuid;
            var ioc_tabs_view = new IOCTabsView({
                collection: view.iocs
            });
            ioc_tabs_view.listenTo(vent, StrikeFinderEvents.SF_IOC_TAB_SELECT, function (exp_key) {
                // Update the hits details view expression key whenever an IOC tab is selected.
                view.exp_key = exp_key;
                console.info('Hits details view now associated with exp_key: ' + exp_key);
            });

            new FetchController({
                model: view.iocs,
                view: ioc_tabs_view,
                region: view.ioc_tabs_region
            })
                .fetch({
                    success: function() {
                        ioc_tabs_view.select_tab(view.default_exp_key);
                    }
                });
        },

        //
        // Create the context menu component.
        //
        render_context_menu: function () {
            var view = this;
            view.context_menu = new AuditContextMenuView({
                source: view.audit_region.el,
                suppress: view.options.suppress,
                acquire: view.options.acquire,
                masstag: view.options.masstag
            });
            // Attach the menu to a div at a base level in the page.
            $('.highlighter-container').append(view.context_menu.render().el);
        },

        render_comments: function (rowitem_uuid) {
            var view = this;

            var comments = new CommentsCollection();
            comments.rowitem_uuid = rowitem_uuid;

            var collapsable = new CollapsableView({
                collapsed: true,
                title: '<i class="fa fa-comments"></i> Comments'
            });
            view.comments_region.show(collapsable);

            new FetchController({
                collection: comments,
                region: view.comments_region
            })
                .fetch({
                    success: function() {
                        collapsable.set_title(_.sprintf('<i class="fa fa-comments"></i> Comments (%s)', comments.length));
                        var comments_view = new CommentsView({
                            collection: comments
                        });
                        collapsable.show(comments_view);
                        if (comments.length > 0) {
                            collapsable.expand();
                        }
                    }
                });
        },

        //
        // Display the tasks for the current identity.
        //
        render_tasks: function (identity) {
            var view = this;

            var tasks = new AgentTaskCollection();
            tasks.identity = identity;
            tasks.hash = view.row.am_cert_hash;

            var collapsable = new CollapsableView({
                collapsed: true,
                title: '<i class="fa fa-tasks"></i> Agent Tasks'
            });
            view.tasks_region.show(collapsable);

            new FetchController({
                collection: tasks,
                region: view.tasks_region
            })
                .fetch({
                    success: function() {
                        collapsable.set_title(_.sprintf('<i class="fa fa-tasks"></i> Agent Tasks (%s)', tasks.length));
                        var tasks_view = new AgentTasksTableView({
                            collection: tasks,
                            condensed: true
                        });
                        collapsable.show(tasks_view);
                        if (tasks.length > 0) {
                            collapsable.expand();
                        }
                    }
                });
        },

        //
        // Update the view for a specific row item.  Assumes the identity has not changed.
        //
        render_rowitem: function (rowitem_uuid) {
            this.render_audit_details(rowitem_uuid);
            this.render_ioc_details(rowitem_uuid);
            this.render_comments(rowitem_uuid);
        },

        //
        // Render the sub-views when a hit is selected.
        //
        render_details: function (data) {
            // Keep track of the currently selected row.
            var view = this;
            view.row = data;

            view.render_link_details(data.identity);
            view.render_host_details(data.am_cert_hash);
            view.render_audit_details(data.uuid);
            view.render_ioc_details(data.uuid);
            view.render_comments(data.uuid);
            view.render_tasks(data.identity);
            view.render_context_menu();
        },

        onShow: function () {
            var view = this;

            // Display the table controls view, is only rendered once.
            view.prev_next_view = new TableViewControls({
                table_name: view.hits_table_name
            });
            view.prev_next_region.show(view.prev_next_view);
        },

        handle_merge: function (uuid) {
            var view = this;

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

                console.log('The item being merged is being deleted...');

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
        },

        onClose: function () {
            if (this.context_menu) {
                // Clean up the context menu since it attaches to an global region.
                this.context_menu.close();
            }
        }

    });

    uac_utils.mixin(HitsDetailsView, Evented);

    return HitsDetailsView;
});