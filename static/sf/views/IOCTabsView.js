define(function(require) {
    var View = require('uac/common/View');
    var utils = require('uac/common/utils');
    var templates = require('sf/ejs/templates');

    var SuppressionsTableView = require('sf/views/SuppressionsTableView');
    var IOCCollection = require('sf/models/IOCCollection');

    /**
     * Tabbed view of IOC's.
     */
    IOCTabsView = View.extend({
        initialize: function(options) {
            var view = this;

            if (!view.collection) {
                view.collection = new IOCCollection([], {
                    rowitem_uuid: options.rowitem_uuid
                });
            }

            // Filter by default.
            view.filtered = true;

            //view.listenTo(view.collection, 'sync', this.render);
        },
        render: function() {
            var view = this;

            var data = {
                items: view.collection.toJSON(),
                get_active_class: function(index) {
                    if (index == 0) {
                        return "active";
                    } else {
                        return "";
                    }
                }
            };

            // Cleanup any existing components the view has created before rendering.
            view.close();

            view.apply_template(templates, 'ioc-tabs.ejs', data);

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
        select_tab: function(exp_key) {
            var view = this;
            if (exp_key) {
                // Select the specified tab.
                view.$el.find('li > a[name="' + exp_key + '"]').tab('show');
            } else {
                // Select the first tab.
                view.$el.find('li > a').first().tab('show');
            }
        },
        /**
         * Filter the IOC viewer to only the relevant hits.
         */
        filter: function() {
            var view = this;

            view.$el.find('#ioc-filter-button').html('<i class="fa fa-expand"></i> Expand IOC');

            // Iterator over the related IOC models and adjust the corresponding tab.
            _.each(view.collection.models, function(model, index, list) {
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
                } else {
                    selected_ids = [selected_id_string];
                }

                // Iterate over the IOC's selected items.
                _.each(selected_ids, function(selected_id) {
                    var selected_id_selector = '.ioc-guid-' + selected_id;
                    var selected_element = ioc_definition_element.find(selected_id_selector);
                    if (!selected_element) {
                        log.error('Unable to find selected element for selector: ' + selected_id_selector);
                    }

                    // Retrieve the full path of the element to the root.
                    var selected_element_path = view.get_path(selected_element.get(0), ioc_definition_element.get(0));
                    _.each(selected_element_path, function(selected_path_item) {
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
        unfilter: function() {
            var view = this;

            view.$el.find('#ioc-filter-button').html('<i class="fa fa-compress"> Collapse IOC</i>');

            // Iterator over the related IOC models and adjust the corresponding tab.
            _.each(view.collection.models, function(model, index, list) {
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
        on_shown: function(ev) {
            var view = this;
            var exp_key = ev.target.name;

            log.debug('Selected IOC with exp_key: ' + exp_key);
            view.trigger('ioc:selected', exp_key);

            if (!_.has(view.suppressions_table_map, exp_key)) {
                // Initialize the suppressions table for the expression.

                log.debug('Initializing suppressions table for exp_key: ' + exp_key);

                var suppressions_table = new SuppressionsTableView({
                    el: view.$el.find(_.sprintf('table#%s.suppressions-table', exp_key)),
                    condensed: true
                });
                view.listenTo(suppressions_table, 'delete', function() {
                    // Trigger a higher level event when a suppression has been deleted.
                    view.trigger('suppression:deleted');
                });

                view.suppressions_table_map[exp_key] = suppressions_table;

                suppressions_table.fetch(exp_key);
            }
        },
        on_click: function() {
            var view = this;
            view.filtered = !view.filtered;
            if (view.filtered) {
                view.filter();
            } else {
                view.unfilter();
            }
        },
        /**
         * Get the path to the element from the parent.
         * @param element - the element whose path we are retrieving.
         * @param parent - find the path up to this element.
         * @returns {Array} of elements.
         */
        get_path: function(element, parent) {
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
        fetch: function(rowitem_uuid) {
            if (rowitem_uuid) {
                this.collection.rowitem_uuid = rowitem_uuid;
            }

            this.block();
            this.collection.fetch();
        },
        close: function() {
            var view = this;

            // Clean up any of the existing tables and rows.
            if (view.suppressions_table_map) {
                log.debug('Closing ' + Object.keys(view.suppressions_table_map).length + ' suppression tables...');
                _.each(_.values(view.suppressions_table_map), function(table) {
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

    return IOCTabsView;
});