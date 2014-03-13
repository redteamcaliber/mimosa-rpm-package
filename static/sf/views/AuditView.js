define(function(require) {
    var View = require('uac/common/View');

    /**
     * Audit content details view.
     */
    AuditView = View.extend({
        initialize: function(options) {
            var view = this;
            if (view.model) {
                view.listenTo(view.model, 'sync', view.render);
            }
        },
        render: function() {
            var view = this;

            view.close();

            view.$el.html(view.model.get('content'));

            view.delegateEvents({
                'click .md5-view': 'on_click_md5'
            });

            this.collapse();

            return this;
        },
        on_click_md5: function(ev) {
            var dlg = new StrikeFinder.MD5View({
                el: '#dialog-div',
                model: new Backbone.Model($(ev.currentTarget).data().md5)
            });
            dlg.render();

            return false;
        },
        close: function() {
            this.undelegateEvents();
        }
    });

    return AuditView;
});