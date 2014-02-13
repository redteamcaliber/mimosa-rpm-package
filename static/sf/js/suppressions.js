var StrikeFinder = StrikeFinder || {};

/**
 * View representing a row of the suppressions table view.
 */
StrikeFinder.SuppressionRowView = StrikeFinder.View.extend({
    events: {
        'click i.destroy': 'on_delete'
    },
    initialize: function(options) {
        var view = this;
        var link = window.location.protocol + '//' + window.location.hostname +
            (window.location.port ? ':' + window.location.port : '') + '/sf/suppressions/' + this.model.get('suppression_id');
        var html = StrikeFinder.template('link.ejs', {link: link});

        var button = view.$el.find('i.link');
        button.popover({
            html : true,
            trigger: 'manual',
            content: html
        })
            .data('bs.popover')
            .tip()
            .addClass('link-popover');
        button.on('click', function(ev) {
            button.popover('toggle');
            $('.link-text').select();
            return false;
        });
    },
    on_delete: function (ev) {
        var view = this;
        var message = _.sprintf('Delete suppression: %s', view.model.as_string());
        if (confirm(message)) {
            view.model.destroy({
                success: function (model, response, options) {
                    // The task was submitted successfully to delete the suppression.
                    var response_object = JSON.parse(response);
                    var task_id = response_object.task_id;

                    // Block the UI while deleting.
                    StrikeFinder.block();

                    StrikeFinder.display_success('Submitted task for delete suppression: ' + view.model.as_string());

                    // Try and wait for the task to complete.
                    StrikeFinder.wait_for_task(response_object.task_id, function(err, completed, response) {
                        // Unblock the UI.
                        StrikeFinder.unblock();

                        if (err) {
                            // Error checking the task result.
                            StrikeFinder.display_error(err);
                        }
                        else if (completed) {
                            // The task was completed successfully.
                            StrikeFinder.display_success('Successfully deleted suppression: ' +
                                view.model.as_string());

                            // Notify that the suppression was deleted.
                            view.trigger('delete', view.model);
                        }
                        else {
                            // The task is still running.
                            var task_message = _.sprintf('The task deleting suppression: %s is still running and ' +
                                'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                view.model.as_string());
                            StrikeFinder.display_info(task_message);
                        }
                    });
                },
                error: function(model, xhr) {
                    // Error submitting the task.
                    try {
                        var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                        StrikeFinder.display_error('Error while submitting delete suppression task - ' + message);
                    }
                    finally {
                        StrikeFinder.unblock();
                    }
                }
            });
        }
    },
    close: function () {
        log.debug('Closing row view...');
        this.$el.find('i.link').popover('destroy');
        // Manually removing the popover due to -> https://github.com/twbs/bootstrap/issues/10335
        this.$el.parent().find('.popover').remove();
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
        view.listenTo(view.collection, 'reset', view.render);

        var condensed = view.options['condensed'];

        // Add a collapsable container.
        view.suppressions_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el,
            collapsed: condensed
        });
        var update_title = function () {
            // Update the suppressions collapsable count whenever the data has changed.
            var title_template = '<i class="fa fa-level-down"></i> Suppressions (%d)';
            view.suppressions_collapsable.set('title', _.sprintf(title_template, view.collection.length));
        };
        view.collection.listenTo(view.collection, 'sync', update_title);
        view.collection.listenTo(view.collection, 'reset', update_title);

        view.listenTo(view, 'load', function () {
            // Select the first row on load.
            view.select_row(0);
        });

        view.options.oLanguage = {
            sEmptyTable: 'No suppressions were found',
            sZeroRecords: 'No matching suppressions found'
        };

        if (condensed) {
            view.options['iDisplayLength'] = -1;

            view.options['sDom'] = 't';

            view.options['aoColumns'] = [
                {sTitle: "Suppression Id", mData: 'suppression_id', bVisible: false, bSortable: false},
                {sTitle: "Suppression", mData: 'comment', bVisible: true, bSortable: false, sClass: 'wrap'},
                {sTitle: "Global", mData: 'cluster_name', bVisible: true, bSortable: false},
                {sTitle: "Hits", mData: 'suppressed', bVisible: true, bSortable: false},
                {sTitle: "Created", mData: 'created', bSortable: true, sClass: 'nowrap', visible: false}
            ];

            view.listenTo(view, 'row:created', function(row) {
                // Escape the comment field.
                view.escape_cell(row, 1);
            });

            view.options['aoColumnDefs'] = [
                {
                    // `data` refers to the data for the cell (defined by `mData`, which
                    // defaults to the column being worked with, in this case is the first
                    // Using `row[0]` is equivalent.
                    mRender: function (data, type, row) {
                        var formatted = StrikeFinder.format_suppression(row);

                        var suppression_name = _.sprintf('<a href="/sf/suppressions/%s" onclick="ev.stopPropagation()">%s</a>',
                            row.suppression_id, formatted);

                        var delete_link = '<i class="fa fa-times-circle text-default destroy" title="Delete Suppression"></i>';

                        var link = ' <i class="fa fa-link text-default link"></i>';

                        return delete_link + ' ' + suppression_name + ' ' + link;
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

            view.options.aaSorting = [
                [4, 'asc']
            ];
        }
        else {
            view.options.aoColumns = [
                {sTitle: "Suppression Id", mData: 'suppression_id', bVisible: false},
                {sTitle: "Rule", mData: 'comment', bSortable: true, sWidth: '25%', sClass: 'wrap'},
                {sTitle: "Description", mData: 'comment', bSortable: true, sWidth: '25%', sClass: 'wrap'},
                {sTitle: "IOC", mData: 'iocname', bSortable: true, sClass: 'nowrap'},
                {sTitle: "IOC UUID", mData: 'ioc_uuid', bSortable: false, bVisible: false},
                {sTitle: "Hits", mData: 'suppressed', bSortable: true},
                {sTitle: "Global", mData: 'cluster_name', bVisible: true, bSortable: true},
                {sTitle: "Author", mData: 'user_uuid', bSortable: true},
                {sTitle: "Created", mData: 'created', bSortable: true, sClass: 'nowrap'}
            ];

            view.listenTo(view, 'row:created', function(row) {
                // Escape the comment field.
                view.escape_cell(row, 1);
            });

            view.options.aoColumnDefs = [
                {
                    // Add an option to the display name to g the row.
                    mRender: function (data, type, row) {
                        return '<i class="fa fa-times-circle text-default destroy" title="Delete Suppression"></i> ' +
                            StrikeFinder.format_suppression(row) +
                            ' <i class="fa fa-link text-default link"></i>';
                    },
                    aTargets: [1]
                },
                {
                    // Render global or not.
                    mRender: function (data, type, row) {
                        if (!data) {
                            return 'Global';
                        }
                        else {
                            return data;
                        }
                    },
                    aTargets: [6]
                },
                {
                    // Format the created date.
                    mRender: function (data, type, row) {
                        return StrikeFinder.format_date_string(data);
                    },
                    aTargets: [8]
                }
            ];

            view.options.aaSorting = [
                [8, 'asc']
            ];

            view.options.iDisplayLength = 10;
            view.options.sDom = 'lf<""t>ip';
        }

        // Keep track of the row views.
        view.suppression_row_views = [];

        view.listenTo(view, 'row:created', function(row, data, index) {
            var suppression_row = new StrikeFinder.SuppressionRowView({
                el: $(row),
                model: view.collection.at(index)
            });
            suppression_row.listenTo(suppression_row, 'delete', function () {
                view.trigger('delete');
            });
            view.suppression_row_views.push(suppression_row);
        });
    },
    fetch: function (exp_key) {
        if (exp_key) {
            this.collection.exp_key = exp_key;
        }
        this.collection.fetch();
    },
    close: function() {
        log.debug('Closing suppression table: ' + this.el.id + ' with ' + this.suppression_row_views.length + ' rows.');

        // Clean up the suppression row listeners.
        _.each(this.suppression_row_views, function(row) {
            row.close();
        });
        this.suppression_row_views = [];

        // Destroy the suppressions datatable.
        this.destroy();

        // Remove any current listeners.
        this.stopListening();
    }
});

/**
 * Hits table for a suppression.
 */
StrikeFinder.HitsSuppressionTableView = StrikeFinder.TableView.extend({
    initialize: function () {
        var view = this;

        view.hits_collapsable = new StrikeFinder.CollapsableContentView({
            el: view.el
        });

        view.options.oLanguage = {
            sEmptyTable: 'The selected suppression is not matching any hits',
            sZeroRecords: 'No matching hits found'
        };

        view.options['sAjaxSource'] = '/sf/api/hits';
        view.options.sAjaxDataProp = 'results';
        view.options['bServerSide'] = true;

        view.options['aoColumns'] = [
            {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false},
            {sTitle: "Created", mData: "created", bVisible: true, bSortable: true, sClass: 'nowrap', sWidth: '10%'},
            {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false},
            {sTitle: "rowitem_type", mData: "rowitem_type", bVisible: false, bSortable: false},
            {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false},
            {sTitle: "Summary", mData: "summary1", bSortable: true, sClass: 'wrap'},
            {sTitle: "Summary2", mData: "summary2", bSortable: true, sClass: 'wrap'},
            {sTitle: "MD5", mData: "md5sum", sClass: 'nowrap', bSortable: true}
        ];

        view.options.aaSorting = [[1, 'desc']];

        view.options.aoColumnDefs = [
            view.date_formatter(1)
        ];


        view.options.sDom = 'ltip';
        view.listenTo(view, 'load', function () {
            view.select_row(0);

            view.hits_collapsable.set('title', _.sprintf('<i class="fa fa-level-down"></i> Suppressed Hits (%s)',
                view.get_total_rows()));
        });
    }
});

StrikeFinder.SuppressionsAppView = StrikeFinder.View.extend({
    initialize: function () {
        var view = this;

        view.suppressions = new StrikeFinder.SuppressionListItemCollection();
        view.suppressions_table = new StrikeFinder.SuppressionsTableView({
            el: '#suppressions-table',
            collection: view.suppressions
        });
        view.listenTo(view.suppressions_table, 'click', view.render_hits);
        view.listenTo(view.suppressions_table, 'delete', function() {
            if (StrikeFinder.single_entity) {
                view.suppressions.reset([]);
            }
            else {
                StrikeFinder.block();
                view.suppressions.fetch({
                    success: function() {
                        view.suppressions_table.select_row(0);
                        StrikeFinder.unblock();
                    },
                    failure: function() {
                        StrikeFinder.unblock();
                    }
                });
            }
        });
        view.listenTo(view.suppressions_table, 'empty', function () {
            $('.hits-view').fadeOut().hide();
            $('.details-view').fadeOut().hide();
        });

        view.suppressions.reset(StrikeFinder.suppressions);
    },
    render_hits: function (data) {
        var view = this;

        log.debug('Row selected: ' + JSON.stringify(data));

        var suppression_id = data['suppression_id'];

        view.run_once('init_hits', function () {
            view.hits_table_view = new StrikeFinder.HitsSuppressionTableView({
                el: '#hits-table'
            });

            view.hits_details_view = new StrikeFinder.HitsDetailsView({
                el: '#hits-details-view',
                hits_table_view: view.hits_table_view,
                tag: false,
                suppress: false,
                masstag: false
            });

            // Hits facets.
            view.facets_view = new StrikeFinder.HitsFacetsView({
                el: '#hits-facets-div'
            });

            // Listen to criteria changes and reload the views.
            view.listenTo(view.facets_view, 'refresh', function(attributes) {
                // Reload the hits.
                view.hits_table_view.fetch(attributes);
            });
        });

        // Specify the host as default criteria.
        view.facets_view.fetch({suppression_id: suppression_id});

        $('.hits-view').fadeIn().show();
    }
});
