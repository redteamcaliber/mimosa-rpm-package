define(function (require) {
    var View = require('uac/views/View');
    var TableViewControls = require('uac/views/TableViewControls');

    var HitsLinkView = require('sf/views/HitsLinkView');
    var AgentHostView = require('sf/views/AgentHostView');
    var IOCTabsView = require('sf/views/IOCTabsView');
    var AuditView = require('sf/views/AuditView');
    var TagView = require('sf/views/TagView');
    var IdentitiesView = require('sf/views/IdentitiesView');
    var MergeAllView = require('sf/views/MergeAllView');
    var MergeView = require('sf/views/MergeView');
    var SuppressionFormView = require('sf/views/SuppressionFormView');
    var AcquireFormView = require('sf/views/AcquireFormView');
    var MassTagFormView = require('sf/views/MassTagFormView');
    var AuditContextMenuView = require('sf/views/AuditContextMenuView');
    var CommentsView = require('sf/views/CommentsView');
    var AcquisitionsViewCondensed = require('sf/views/AcquisitionsViewCondensed');

    var IOCCollection = require('sf/models/IOCCollection');
    var AuditModel = require('sf/models/AuditModel');
    var SuppressionModel = require('sf/models/SuppressionModel');

    var utils = require('uac/common/utils');
    var sf_utils = require('sf/common/utils');

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
    HitsDetailsView = View.extend({
        initialize: function(options) {
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
            view.listenTo(view.hits_table_view, 'empty', function() {
                // Hide all components with the details view class.
                $('.sf-details-view').fadeOut().hide();
            });

            // Create the link view for displaying hit url links.
            view.link_view = new HitsLinkView({
                el: '#link-button',
                table: view.hits_table_view
            });
        },
        /**
         * The user has selected a hit, render the details of that hit.
         * @param data - the hit data.
         */
        render_details: function(data) {
            var view = this;
            // Capture the current row on the view instance.
            view.row = data;

            console.log('Hits row selected: ' + JSON.stringify(data));

            view.run_once('init_details', function() {
                //
                // Initialize the details components.

                // Prev/next controls.
                view.prev_next_view = new TableViewControls({
                    el: '#prev-next-div',
                    table: view.hits_table_view,
                    paging: false
                });
                view.prev_next_view.render();

                // Agent host view.
                view.agenthost_view = new AgentHostView({
                    el: '#agent-host-div'
                });

                // IOC tabs view.
                view.iocs = new IOCCollection();
                view.ioc_tabs_view = new IOCTabsView({
                    collection: view.iocs
                });
                view.listenTo(view.ioc_tabs_view, 'ioc:selected', function(exp_key) {
                    // Update the hits details view expression key whenever an IOC tab is selected.
                    view.exp_key = exp_key;
                    console.log('Hits details view now associated with exp_key: ' + exp_key);
                });
                view.listenTo(view.ioc_tabs_view, 'suppression:deleted', function() {
                    // Reload the hits after a suppression has been deleted.  Attempt to select the same row that we are
                    // current positioned on.
                    view.hits_table_view.refresh({
                        name: 'uuid',
                        value: view.row.uuid
                    });
                });
                view.listenTo(view.iocs, 'sync', function() {
                    // Reload the tabs view.
                    $('#iocs-div').html(view.ioc_tabs_view.render().el);
                    // Select and IOC tab.
                    view.ioc_tabs_view.select_tab(view.default_exp_key);
                });

                // Audit view.
                view.audit = new AuditModel();
                view.audit_view = new AuditView({
                    el: $("#audit-div"),
                    model: view.audit
                });

                // Initialize the tag view from the audit data.
                var tagging_enabled = !'tag' in view.options || view.options.tag !== false;
                view.tags = new TagCollection();
                // Display the tags view unless explicitly disabled.
                view.tags_view = new TagView({
                    el: '#tags',
                    collection: view.tags,
                    model: view.audit,
                    disabled: !tagging_enabled
                });
                if (tagging_enabled) {
                    // Only listen to create events if tagging is enabled.
                    view.listenTo(view.tags_view, 'create', function(rowitem_uuid, tagname) {
                        // Reload the details view.
                        view.fetch(rowitem_uuid);
                        // We have tagged the Trigger an event when a new tag has been created.
                        view.trigger('create:tag', rowitem_uuid, tagname);
                    });
                }
                sf_utils.get_tags(function(err, tags) {
                    if (err) {
                        // Error.
                        view.display_error('Exception while loading tags: ' + err);
                    } else {
                        view.tags.reset(tags);
                    }
                });

                // Initialize the identities view.
                view.identities_view = new IdentitiesView({
                    el: '#identities',
                    model: view.audit
                });
                view.listenTo(view.identities_view, 'click', function(uuid_identity) {
                    view.fetch(uuid_identity);
                });

                // Merge all button view.
                view.merge_all_view = new MergeAllView({
                    el: '#merge-all',
                    model: view.audit
                });
                view.merge_all_view.listenTo(view.merge_all_view, 'mergeall', function(uuid) {

                });

                // Merge button view.
                view.merge_view = new MergeView({
                    el: '#merge',
                    model: view.audit
                });

                // Update the audit type on the view.
                view.listenTo(view.audit, 'sync', function() {
                    $('#audit-type').html(view.audit.get('rowitem_type'));

                    // Unblock all of the audit dependent views.
                    view.unblock($('.audit-content'));
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
                    } else {
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
                        } else {
                            var prev_data = view.hits_table_view.peek_prev_data();
                            if (prev_data) {
                                // Select the previous row.
                                view.hits_table_view.refresh({
                                    name: 'uuid',
                                    value: prev_data.uuid
                                })
                            } else {
                                // Try and select the first row if there is one.
                                view.hits_table_view.select_row(0);
                            }
                        }
                    }
                }

                view.listenTo(view.merge_view, 'merge', function(source_uuid, dest_uuid) {
                    handle_merge(dest_uuid);
                });
                view.listenTo(view.merge_all_view, 'mergeall', function(uuid) {
                    handle_merge(uuid);
                });

                // Suppression form.
                view.suppression_form_view = new SuppressionFormView({
                    el: $("#dialog-div")
                });
                view.listenTo(view.suppression_form_view, 'create', function(model) {
                    view.trigger('create:suppression', view.row, model);
                });

                // Acquire form.
                view.acquire_form_view = new AcquireFormView({
                    el: '#dialog-div'
                });
                view.listenTo(view.acquire_form_view, 'create', function(model) {
                    // After an acquisition the row tag should be investigating.
                    view.trigger('create:acquire', view.row, model);
                });

                // Mass tag form.
                view.mass_tag_form = new MassTagFormView({
                    el: '#dialog-div'
                });
                view.listenTo(view.mass_tag_form, 'create', function(model) {
                    view.trigger('create:masstag', view.row, model);
                });

                // Context menu.
                view.context_menu = new AuditContextMenuView({
                    el: $("#context-menu-div"),
                    source: "#audit-div",
                    suppress: view.options.suppress,
                    acquire: view.options.acquire,
                    masstag: view.options.masstag
                });
                view.listenTo(view.context_menu, 'suppress', function(selection, ioc_term) {
                    console.log(_.sprintf('Creating suppression for text: %s, rowitem_type: %s, and term: %s',
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
                view.listenTo(view.context_menu, 'acquire', function(selection) {
                    var agent_host_data = view.agenthost_view.attributes();

                    // Use the cluster uuid from Seasick.
                    var ss_cluster_uuid = null;
                    if (agent_host_data && agent_host_data.cluster && agent_host_data.cluster.uuid) {
                        ss_cluster_uuid = agent_host_data.cluster.uuid;
                    }

                    if (ss_cluster_uuid) {
                        view.acquire_form_view.render({
                            identity: view.row.identity,
                            selection: selection,
                            am_cert_hash: view.row.am_cert_hash,
                            cluster_uuid: ss_cluster_uuid,
                            cluster_name: view.row.cluster_name,
                            rowitem_uuid: view.row.uuid
                        });
                    } else {
                        // Error
                        view.display_error('Unable to submit acquisition, check Seasick status.');
                    }
                });
                view.listenTo(view.context_menu, 'tag', function(selection, ioc_term) {
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
                view.listenTo(view.context_menu, 'auto-suppress', function(selection, ioc_term) {
                    // Auto create a suppression.
                    var suppression_model = new SuppressionModel({
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
                        _.each(errors, function(error) {
                            view.display_error(error);
                        });
                    } else {
                        // Ok.
                        view.block();

                        suppression_model.save({}, {
                            success: function(model, response) {
                                // The task has been submitted for the suppression.
                                var submit_message = _.sprintf('Submitted task for suppression: %s',
                                    suppression_model.as_string());
                                view.display_success(submit_message);

                                // Try and wait for the task result.
                                sf_utils.wait_for_task(response.task_id, function(err, completed, response) {
                                    view.unblock();

                                    if (err) {
                                        // Error checking the task result.
                                        view.display_error(err);
                                    } else if (completed) {
                                        // The task was completed successfully.
                                        var msg = _.sprintf('Successfully suppressed %s hits for %s',
                                            response.result.summary, suppression_model.as_string());
                                        view.display_success(msg);

                                        // Notify that a suppression was created.
                                        view.trigger('create:suppression', view.row, suppression_model);
                                    } else {
                                        // The task did not complete and is running in the background.
                                        var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                            'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                            suppression_model.as_string());
                                        view.display_info(task_message);
                                    }
                                });
                            },
                            error: function(model, xhr) {
                                try {
                                    var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                                    view.display_error('Error while submitting auto suppression task - ' + message);
                                } finally {
                                    view.unblock();
                                }
                            }
                        });
                    }
                });

                // Comments view.
                view.comments_view = new CommentsView({
                    el: '#comments-div'
                });

                // Acquisitions view.
                view.acquisitions_view = new AcquisitionsViewCondensed({
                    el: '#acquisitions-table'
                });
            });

            view.fetch();
        },
        fetch: function(rowitem_uuid) {
            var view = this;

            // Update the child views with the current row's parameters.

            var uuid;
            if (rowitem_uuid) {
                // A specific rowitem was specified.
                uuid = rowitem_uuid;
            } else {
                // A row item was not specified, use the current selected row.
                uuid = view.row.uuid;

                // Update the host data unless we are just changing to date within this identity.  Assumes that all row
                // item versions for this identity are for the same host.
                view.agenthost_view.fetch(view.row.am_cert_hash);

                // Update the acquisitions.
                view.acquisitions_view.fetch(view.row.identity);
            }

            // Fetch the related audit and update the audit view, tags view, and identity data.
            view.audit.set('id', uuid, {
                silent: true
            });

            // Block the entire audit pane including the menu options.
            view.block_element($('.audit-content'));

            view.audit.fetch();

            // Update the IOC.
            view.ioc_tabs_view.fetch(uuid);

            // Update the comments.
            view.comments_view.fetch(uuid);

            $('.sf-details-view').fadeIn().show();
        }
    });

    return HitsDetailsView;
});