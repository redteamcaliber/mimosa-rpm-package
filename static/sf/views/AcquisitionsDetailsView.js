define(function (require) {
    var async = require('async');
    var View = require('uac/views/View');

    var AcquisitionAuditModel = require('sf/models/AcquisitionAuditModel');

    var templates = require('sf/ejs/templates');
    var sf_utils = require('sf/common/utils');

    /**
     * Render the details of an acquisition including the file audit and issues.
     */
    AcquisitionsDetailsView = View.extend({
        events: {
            'click #close': 'on_close'
        },
        render: function() {
            var view = this;

            async.waterfall([
                function(callback) {
                    // Retrieve the file audit if there is a link defined.
                    if (view.model.get('link')) {
                        var audit = new AcquisitionAuditModel({
                            id: view.model.get('uuid')
                        });
                        audit.fetch({
                            success: function(model) {
                                // Ok.
                                callback(null, model.get('content'));
                            },
                            error: function(model, response) {
                                // Error.
                                if (response.status == 404) {
                                    // No audit found.
                                    callback(null, null);
                                }
                                else {
                                    var response_text = response && response.responseText ? response.responseText : 'NA';
                                    callback('Error while retrieving file audit: ' + response_text);
                                }
                            }
                        });
                    }
                    else {
                        // There was not a link.
                        callback(null, undefined);
                    }
                },
                function(audit) {
                    // Render the details template.
                    var context = view.model.toJSON();
                    context.is_link = context.link ? true : false;
                    context.is_error = context.error_message ? true : false;
                    context.format_state = sf_utils.format_acquisition_state;
                    context.format_level = sf_utils.format_acquisition_level;
                    context.is_audit = audit ? true : false;
                    context.audit = audit;

                    view.apply_template(templates, 'acquisition-details.ejs', context);

                    view.collapse(view.el);

                    view.$('#acquisition-details-div').modal({
                        backdrop: false
                    });
                }
            ]);
        },
        close: function () {
            this.stopListening();
        }
    });

    return AcquisitionsDetailsView;
});