define(function (require) {
    var async = require('async');
    var Marionette = require('marionette');

    var utils = require('uac/common/utils');
    var vent = require('uac/common/vent');

    var StrikeFinderEvents = require('sf/common/StrikeFinderEvents');
    var sf_utils = require('sf/common/utils');
    var templates = require('sf/ejs/templates');
    var SuppressionModel = require('sf/models/SuppressionModel');
    var IOCCollection = require('sf/models/IOCCollection');
    var IOCTermsCollection = require('sf/models/IOCTermsCollection');


    /**
     * Form view for creating a suppression.
     */
    var SuppressionFormView = Marionette.ItemView.extend({
        template: templates['suppression-form.ejs'],
        initialize: function (options) {
            if (options) {
                this.itemvalue = options.itemvalue;
                this.itemkey = options.itemkey;
                this.rowitem_type = options.rowitem_type;
                this.exp_key = options.exp_key;
                this.cluster_uuid = options.cluster_uuid;
                this.iocs = options.iocs;
            }

            console.debug('Creating suppression for exp_key: ' + this.exp_key);

            if (!options) {
                // Error, params are required.
                throw new Error('"options" is undefined.');
            }
            else if (!this.exp_key) {
                // Error, exp_key is required.
                throw new Error('"exp_key" is undefined.');
            }
            else if (!this.itemvalue) {
                // Error, itemvalue is required.
                throw new Error('"itemvalue" is undefined.');
            }
            else if (!this.rowitem_type) {
                // Error, item_type is required.
                throw new Error('"rowitem_type" is undefined.');
            }
            else if (!this.cluster_uuid) {
                // Error, cluster_uuid is required.
                throw new Error('"cluster_uuid" is undefined.');
            }
        },
        events: {
            "click #suppress": "suppress",
            "click #cancel": "cancel"
        },
        serializeData: function () {
            var view = this;

            // Create a new suppression model and associated it with the form.
            view.model = new SuppressionModel({
                itemvalue: view.itemvalue,
                rowitem_type: view.rowitem_type,
                exp_key: view.exp_key,
                cluster_uuid: view.cluster_uuid
            });

            if (view.itemkey) {
                view.model.set('itemkey', view.itemkey);
            }

            console.log('Loading suppression form using params: ' + JSON.stringify(view.model.attributes));

            // Retrieve the IOC terms.
            var terms = new IOCTermsCollection([], {
                rowitem_type: view.model.get("rowitem_type")
            });
            terms.fetch({
                async: false,
                error: function (collection, response) {
                    utils.display_response_error('Error looking up IOC terms.', response);
                }
            });

            var data = view.model.toJSON();
            if (terms) {
                data.terms = terms.toJSON();
                console.log('Retrieved ' + terms.length + ' terms...');
            }
            else {
                console.warn('Terms was invalid');
                data.terms = [];
            }

            data.iocs = view.iocs;

            return data;
        },
        onRender: function (params) {
            var view = this;
            view.$("#suppression-form").modal({
                backdrop: false
            });
        },
        suppress: function () {
            var view = this;
            var form = $('#suppression-form');
            try {
                utils.block_element(form, true);

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
                    _.each(errors, function (error) {
                        utils.display_error(error);
                    });
                    return; // **EXIT**
                }
            }
            finally {
                utils.unblock(form);
            }

            utils.block_element(form, true);
            view.model.save({}, {
                success: function (model, response) {
                    var submit_message = _.sprintf('Submitted task for suppression: %s',
                        view.model.as_string());

                    utils.display_success(submit_message);

                    sf_utils.wait_for_task(response.task_id, function (err, completed, response) {
                        // Unblock the UI.
                        utils.unblock(form);

                        if (err) {
                            // Error
                            utils.display_error(err);
                        }
                        else if (completed) {
                            // The task was completed successfully.
                            var success_message = 'Successfully suppressed %s hit(s) with suppression: %s';
                            utils.display_success(_.sprintf(success_message,
                                response.result.summary, view.model.as_string()));

                            // Notify that a suppression was created.
                            view.trigger('create', view.model);
                            vent.trigger(StrikeFinderEvents.SF_SUPPRESS_CREATE, view.model);

                            // Hide the form.
                            view.$("#suppression-form").modal("hide");
                        }
                        else {
                            var task_message = _.sprintf('The task for suppression: %s is still running and ' +
                                    'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                view.model.as_string());
                            view.display_info(task_message);

                            // Hide the form.
                            view.$("#suppression-form").modal("hide");
                        }
                    });
                },
                error: function (model, response) {
                    try {
                        utils.display_response_error('Error while submitting suppression task.', response);
                    }
                    finally {
                        utils.unblock(form);
                    }
                }
            });
        },
        cancel: function () {
            this.$("#suppression-form").modal("hide");
            // Notify that the dialog was canceled.
            this.trigger('cancel');
        }
    });

    return SuppressionFormView;
});