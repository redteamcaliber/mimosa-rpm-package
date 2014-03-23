define(function (require) {
    var $ = require('jquery');
    var View = require('uac/views/View');
    var utils = require('uac/common/utils');
    var templates = require('sf/ejs/templates');
    var typeahead = require('typeahead');

    var HostTypeAheadView = View.extend({
        initialize: function () {
            this.render();
        },
        render: function () {
            var view = this;
            var typeahead = this.$el.typeahead({
                name: 'hosts',
                remote: {
                    url: '/sf/api/hosts?hosts=%QUERY',
                    beforeSend: function (jqXhr, settings) {
                        view.block();
                    },
                    filter: function (response) {
                        utils.unblock();
                        if (!response || response.length === 0) {
                            view.display_info('No matching hosts found.');
                        }
                        return response;
                    }
                },
                valueKey: 'hostname',
                template: 'host-condensed.ejs',
                engine: {
                    compile: function (template) {
                        return {
                            render: function (context) {
                                return utils.run_template(templates, template, context);
                            }
                        };
                    }
                }
            });

            $('.tt-dropdown-menu').addClass('dropdown-menu');

            typeahead.on('typeahead:selected', function (evt, data) {
                window.location = _.sprintf('/sf/host/%s/', data.hash);
            });
        }
    });

    return HostTypeAheadView;
});