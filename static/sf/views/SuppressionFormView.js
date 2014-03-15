define(function(require) {
    var View = require('uac/views/View');
    var utils = require('sf/common/utils');
    var SuppressionModel = require('sf/models/SuppressionModel');
    var IOCTermsCollection = require('sf/models/IOCTermsCollection');
    var templates = require('sf/ejs/templates');


    /**
     * Form view for creating a suppression.
     */
    var SuppressionFormView = View.extend({
        events: {
            "click #suppress": "suppress",
            "click #cancel": "cancel"
        },
        render: function(params) {
            var view = this;

            var itemvalue = params.itemvalue;
            var rowitem_type = params.rowitem_type;
            var exp_key = params.exp_key;
            var cluster_uuid = params.cluster_uuid;

            console.log('Creating suppression for exp_key: ' + exp_key);
            if (!params) {
                // Error, params are required.
                throw new Error('"params" is undefined.');
            } else if (!params.exp_key) {
                // Error, exp_key is required.
                throw new Error('"exp_key" is undefined.');
            } else if (!params.itemvalue) {
                // Error, itemvalue is required.
                throw new Error('"itemvalue" is undefined.');
            } else if (!params.rowitem_type) {
                // Error, item_type is required.
                throw new Error('"rowitem_type" is undefined.');
            } else if (!params.cluster_uuid) {
                // Error, cluster_uuid is required.
                throw new Error('"cluster_uuid" is undefined.');
            }

            console.log('Rendering suppression form view...');

            // Create a new suppression model and associated it with the form.
            view.model = new SuppressionModel({
                itemvalue: itemvalue,
                rowitem_type: rowitem_type,
                exp_key: exp_key,
                cluster_uuid: cluster_uuid
            });

            if (params.itemkey) {
                view.model.set('itemkey', params.itemkey);
            }

            console.log('Loading suppression form using params: ' + JSON.stringify(view.model.attributes));

            // Deep copy the model values.
            var data = view.model.toJSON();

            var terms = new IOCTermsCollection([], {
                rowitem_type: this.model.get("rowitem_type")
            });
            terms.fetch({
                async: false
            });

            if (terms) {
                console.log('Retrieved ' + terms.length + ' terms...');
                data.terms = terms.toJSON();
            } else {
                log.warning('Terms was invalid');
                data.terms = [];
            }

            // Add the ioc's.
            if (params.iocs) {
                data.iocs = params.iocs.toJSON();
            } else {
                data.iocs = [];
            }

            // Retrieve the related IOC terms.
            view.apply_template(templates, 'suppression-form.ejs', data);

            view.$("#suppression-form").modal({
                backdrop: false
            });
        },
        suppress: function() {
            var view = this;
            var form = $('#suppression-form');
            try {
                view.block_element(form, 'Processing...');

                // Update the model.
                view.model.set('exp_key', view.$("#exp_key").children(":selected").attr("id"));
                view.model.set('comment', view.$("#comment").val());
                view.model.set('condition', view.$("#condition").val());
                view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
                view.model.set('itemvalue', view.$("#itemvalue").val());
                view.model.set('negate', view.$("#negate").is(":checked"));
                view.model.set('preservecase', view.$("#preservecase").is(":checked"));

                // Check if the suppression is global.
                var is_global = view.$("#global").is(":checked");
                if (is_global) {
                    // Remove the cluster_uuid from the model.
                    view.model.unset('cluster_uuid');
                }

                // Validate the model before saving.
                if (!view.model.isValid()) {
                    errors = view.model.validationError;
                    _.each(errors, function(error) {
                        view.display_error(error);
                    });
                    return; // **EXIT**
                }
            } finally {
                view.unblock(form);
            }

            view.block_element(form, 'Processing...');
            view.model.save({}, {
                success: function(model, response) {
                    var submit_message = _.sprintf('Submitted task for suppression: %s',
                        view.model.as_string());

                    view.display_success(submit_message);

                    utils.wait_for_task(response.task_id, function(err, completed, response) {
                        // Unblock the UI.
                        view.unblock(form);

                        if (err) {
                            // Error
                            view.display_error(err);
                        } else if (completed) {
                            // The task was completed successfully.
                            var success_message = 'Successfully suppressed %s hit(s) with suppression: %s';
                            view.display_success(_.sprintf(success_message,
                                response.result.summary, view.model.as_string()));

                            // Notify that a suppression was created.
                            view.trigger('create', view.model);

                            // Hide the form.
                            view.$("#suppression-form").modal("hide");
                        } else {
                            var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                view.model.as_string());
                            view.display_info(task_message);

                            // Hide the form.
                            view.$("#suppression-form").modal("hide");
                        }
                    });
                },
                error: function(model, xhr) {
                    try {
                        var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                        view.display_error('Error while submitting suppression task - ' + message);
                    } finally {
                        view.unblock(form);
                    }
                }
            });
        },
        cancel: function() {
            this.$("#suppression-form").modal("hide");
            // Notify that the dialog was canceled.
            this.trigger('cancel');
        }
    });

    return SuppressionFormView;
});