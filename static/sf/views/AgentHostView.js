define(function(require) {
    var View = require('uac/common/View');
    var utils = require('uac/common/utils');
    var templates = require('sf/ejs/templates');

    /**
     * Agent host view.
     */
    AgentHostView = View.extend({
        initialize: function(options) {
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
        render: function() {
            var view = this;
            if (view.model.get("hash")) {
                // Display the host template.
                view.apply_template(templates, 'agent-host.ejs', view.model.toJSON());
            } else {
                // The host was not found, display alternate message.
                var data = {
                    am_cert_hash: view.model.id
                };
                view.apply_template(templates, 'agent-host-empty.ejs', data);
            }

            return view;
        },
        render_service_down: function() {
            var view = this;
            view.apply_template(templates, 'agent-host-error.ejs', {
                am_cert_hash: view.model.id
            });
        },
        fetch: function(am_cert_hash) {
            var view = this;
            view.model.clear();
            if (am_cert_hash) {
                view.model.id = am_cert_hash;
            }

            utils.block_element(view.$el);

            view.model.fetch({
                error: function(model, response, options) {
                    view.render_service_down();
                }
            });
        },
        attributes: function() {
            return this.model ? this.model.attributes : null;
        }
    });

    return AgentHostView;
});