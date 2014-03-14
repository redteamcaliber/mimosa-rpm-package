define(function (require) {
    var View = require('uac/views/View');
    var templates = require('sf/ejs/templates');

    AcquisitionsAuditView = View.extend({
        events: {
            'click #close': 'on_close'
        },
        initialize: function () {
            var view = this;
            view.model = new StrikeFinder.AcquisitionAuditModel({
                id: view.options.acquisition_uuid
            });
            view.listenTo(view.model, 'sync', view.render);
            view.model.fetch();
        },
        render: function () {
            var view = this;

            view.apply_template(templates, 'acquisition-audit.ejs', view.model.toJSON());

            view.collapse(this.el);

            view.$('#acqusition-audit-div').modal({
                backdrop: false
            });
        },
        on_close: function () {
            this.$("#acqusition-audit-div").modal("hide");
        },
        close: function () {
            this.stopListening();
        }
    });

    return AcquisitionsAuditView;
});