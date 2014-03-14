define(function (require) {
    var View = require('uac/views/View');

    var templates = require('sf/ejs/templates');

    var HitsFacetsModel = require('sf/models/HitsFacetsModel');
    var HitsCriteria = require('sf/models/HitsCriteria');

    /**
     * View to render hits facets.
     */
    HitsFacetsView = View.extend({
        initialize: function () {
            var view = this;

            // TODO: move the outwards.
            view.titles = {
                username: 'User',
                md5sum: 'MD5',
                tagname: 'Tag',
                iocname: 'IOC',
                item_type: 'Item Type',
                am_cert_hash: 'AM Cert Hash',
                exp_key: 'Expression'
            };

            view.icons = {
                username: 'fa-users',
                md5sum: 'fa-file',
                tagname: 'fa-tags',
                iocname: 'fa-warning',
                item_type: 'fa-info',
                am_cert_hash: 'fa-desktop',
                exp_key: 'fa-dot-circle-o'
            };

            view.keys = [
                'tagname',
                'iocname',
                'item_type',
                'exp_key',
                'md5sum',
                'am_cert_hash',
                'username'
            ];

            // Create the facets model.
            view.model = new HitsFacetsModel();
            // Redraw the facets on sync.
            view.listenTo(view.model, 'sync', view.render);

            // Create the criteria.
            view.criteria = new HitsCriteria();
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
                _.each(attributes.am_cert_hash, function (hash) {
                    hash.abbrev = view.shorten(hash.value, 8);
                });
            }

            if (attributes.md5sum) {
                _.each(attributes.md5sum, function (md5) {
                    md5.abbrev = view.shorten(md5.value, 8);
                });
            }

            if (attributes.exp_key) {
                _.each(attributes.exp_key, function (exp_key) {
                    exp_key.abbrev = view.shorten(exp_key.id, 8);
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
            view.apply_template(templates, 'hits-facets.ejs', data);

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
                console.log(_.sprintf('Facet selected: %s, %s', facet_type, facet_id));
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
                view.display_error('Error: anchor does not have facet attributes defined.');
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
            view.block_element(view.$el);
            view.model.fetch({
                error: function (model, response, options) {
                    if (response.statusCode == 404) {
                        view.display_error('Not hits found for criteria: ' + JSON.stringify(view.criteria.attributes));
                    }
                }
            });

            view.trigger('refresh', view.criteria.attributes);
        },
        fetch: function (params) {
            console.log('Reloading the hits facets view...');

            if (params) {
                // Set the initial params on the hits criteria.  These params will survive a reset.
                this.criteria.set_initial(params);
            }

            this.load_facets();
        }
    });

    return HitsFacetsView;
});