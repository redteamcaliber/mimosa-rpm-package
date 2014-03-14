define(function(require) {
    var View = require('uac/views/View');
    var highlighter = require('highlighter');
    var templates = require('sf/ejs/templates')

    /**
     * View for displaying context menu in the File/Info view.
     */
    AuditContextMenuView = View.extend({
        initialize: function() {
            this.render();
        },
        events: {
            "click #suppress-item": "suppress",
            "click #auto-suppress-item": "auto_suppress",
            "click #acquire-item": "acquire",
            "click #tag-item": "tag",
            'click #close-item': 'cancel'
        },
        render: function() {
            var view = this;

            $(view.options.source).highlighter({
                selector: _.sprintf('#%s', view.el.id),
                complete: function(selection, el) {

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
                        } else if ((child_elements = $(el.anchorNode).find('.ioc-term')) && child_elements.length == 1) {
                            // The user clicked an IOC term.
                            var term2 = child_elements.attr('ioc-term');
                            console.log('ioc-term: ' + term2);
                            view.ioc_term = term2;
                            view.$('#ioc-term-item').text(term2);
                            view.$('#auto-suppress-item').css('display', 'block');
                        } else {
                            // Auto suppress is not available.
                            view.$('#auto-suppress-item').css('display', 'none');
                        }
                    } else {
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

            view.apply_template(templates, 'audit-context-menu.ejs', data);
        },
        suppress: function(ev) {
            this.trigger("suppress", this.selection, this.ioc_term);
            this.$el.hide();
        },
        auto_suppress: function(ev) {
            this.trigger("auto-suppress", this.selection, this.ioc_term);
            this.$el.hide();
        },
        acquire: function(ev) {
            this.trigger("acquire", this.selection);
            this.$el.hide();
        },
        tag: function(ev) {
            this.trigger('tag', this.selection, this.ioc_term);
            this.$el.hide();
        },
        cancel: function(ev) {
            this.$el.hide();
        }
    });

    return AuditContextMenuView;
});