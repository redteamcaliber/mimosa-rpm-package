define(function(require) {
    var View = require('uac/views/View');
    var MassTagModel = require('sf/models/MassTagModel');
    var IOCTermsCollection = require('sf/models/IOCTermsCollection');
    var utils = require('sf/common/utils');

    var templates = require('sf/ejs/templates');

    var MassTagFormView = View.extend({
        events: {
            "click #tag": "tag",
            "click #cancel": "cancel"
        },
        render: function(params) {
            var view = this;

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
                // Error, rowitem_type is required.
                throw new Error('"rowitem_type" is undefined.');
            } else if (!params.cluster_uuid) {
                // Error, cluster_uuid is required.
                throw new Error('"cluster_uuid" is undefined.');
            } else if (!params.am_cert_hash) {
                // Error, am_cert_hash is required.
                throw new Error('"am_cert_hash" is undefined.')
            }

            // Create a new mass tag model.
            view.model = new MassTagModel({
                itemvalue: params.itemvalue,
                rowitem_type: params.rowitem_type,
                exp_key: params.exp_key,
                cluster_uuid: params.cluster_uuid,
                am_cert_hash: params.am_cert_hash
            });

            if (params.itemkey) {
                view.model.set('itemkey', params.itemkey);
            }

            // Deep copy the model values.
            var data = this.model.toJSON();

            // Obtain the terms selection.
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
                data['terms'] = [];
            }

            if (params.iocs) {
                data.iocs = params.iocs.toJSON();
            } else {
                data.iocs = [];
            }

            utils.get_tags(function(err, tags) {
                if (err) {
                    // Error
                    view.display_error('Error while loading tags - ' + err);
                } else {
                    data.tags = tags;

                    view.apply_template(templates, 'mass-tag-form.ejs', data);

                    view.$("#mass-tag-form").modal({
                        backdrop: false
                    });
                }
            });
        },
        tag: function() {
            var view = this;
            var form = view.$('#mass-tag-form');

            try {
                // Immediately block to prevent multiple submissions.
                view.block_element(form, 'Processing...');

                // Update the model with the form data.
                view.model.set('exp_key', view.$("#exp_key").children(":selected").attr("id"));
                view.model.set('tagname', view.$("#tagname").val());
                view.model.set('itemkey', view.$("#itemkey").children(":selected").attr("id"));
                view.model.set('condition', view.$("#condition").val());
                view.model.set('negate', view.$("#negate").is(":checked"));
                view.model.set('preservecase', view.$("#preservecase").is(":checked"));
                view.model.set('itemvalue', view.$("#itemvalue").val());
                view.model.set('comment', view.$('#comment').val());

                // Handle the scope.
                var scope = view.$('input:radio[name=scope]:checked').val();
                if (!scope) {
                    // Validation error, this should not happen.
                    view.display_error('"scope" is required.');
                    return; // **EXIT**
                }
                if (scope == 'agent') {
                    view.model.unset('cluster_uuid');
                } else if (scope == 'cluster') {
                    view.model.unset('am_cert_hash');
                } else {
                    // Error, bad scope value.
                    view.display_error(_.sprintf('Invalid scope value (%s), defaulting to cluster.', scope));
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
                success: function(model, response, options) {
                    var task_id = response.task_id;

                    // Submitted the task successfully.
                    view.display_success('Submitted task for mass tag: ' + view.model.as_string());

                    utils.wait_for_task(response.task_id, function(err, completed, response) {
                        view.unblock(form);

                        if (err) {
                            // Error
                            view.display_error(err);
                        } else if (completed) {
                            // The task was completed successfully.
                            var success_message = 'Successfully tagged %s hit(s) with for: %s';
                            view.display_success(_.sprintf(success_message,
                                response.result.summary, view.model.as_string()));

                            // Notify that the mass tag was created.
                            view.trigger('create', view.model);

                            // Hide the form.
                            view.$("#mass-tag-form").modal("hide");
                        } else {
                            // The task is still running.
                            var task_message = _.sprintf('The task for mass tag: %s is still running and ' +
                                'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                view.model.as_string());
                            view.display_info(task_message);

                            // Hide the form.
                            view.$("#mass-tag-form").modal("hide");
                        }
                    });
                },
                error: function(model, response) {
                    // Error submitting the tag task.
                    try {
                        var message = response && response.responseText ? response.responseText : 'Response text not defined.';
                        view.display_error('Error while submitting mass tag task - ' + message);
                    } finally {
                        view.unblock(form);
                    }
                }
            });

        },
        cancel: function() {
            this.$("#mass-tag-form").modal("hide");
            // Notify that the dialog was canceled.
            this.trigger('cancel');
        }
    });

    return MassTagFormView;
});