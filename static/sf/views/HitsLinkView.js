define(function (require) {
    var async = require('async');
    var View = require('uac/views/View');
    var uac_utils = require('uac/common/utils');
    var templates = require('sf/ejs/templates');


    HitsLinkView = View.extend({
        initialize: function (options) {
            if (options.table) {
                this.listenTo(options.table, 'click', this.render);
            }
        },
        render: function (data) {
            var view = this;

            view.close();

            var link = _.sprintf('%s//%s%s/sf/hits/identity/%s', window.location.protocol,
                window.location.hostname, (window.location.port ? ':' + window.location.port : ''), data.identity);
            var html = uac_utils.run_template(templates, 'link.ejs', {
                link: link,
                label: 'Link to Hit'
            });

            view.$el.popover({
                html: true,
                trigger: 'click',
                content: html
            })
                .data('bs.popover')
                .tip()
                .addClass('link-popover');

            view.$el.on('shown.bs.popover', function () {
                $('.link-text').select();
            });
        },
        close: function () {
            this.$el.popover('destroy');
            // Manually removing the popover due to -> https://github.com/twbs/bootstrap/issues/10335
            this.$el.parent().find('.popover').remove();
        }
    });

    return HitsLinkView;
});