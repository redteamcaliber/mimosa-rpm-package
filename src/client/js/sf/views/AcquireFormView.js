define(function (require) {
    var async = require('async');
    Marionette = require('marionette');

    var vent = require('uac/common/vent');
    var utils = require('uac/common/utils');

    var sf_utils = require('sf/common/utils');
    var StrikeFinderEvents = require('sf/common/StrikeFinderEvents');
    var templates = require('sf/ejs/templates');
    var ClusterCredentialsModel = require('sf/models/ClusterCredentialsModel');
    var AgentTask = require('sf/models/AgentTask');

    /**
     * Acquisition input form.
     */
    var AcquireFormView = Marionette.ItemView.extend({
        template: templates['acquire-form.ejs'],

        events: {
            'click #acquire': 'acquire',
            'click #cancel': 'cancel',
            'change #use_cached': 'enable_disable_credentials'
        },

        initialize: function (options) {
            var view = this;
            view.options = options;

            console.log('Rendering acquire form view...');
            console.log('options: ' + JSON.stringify(view.options));

            if (!view.options) {
                // Error, options are required.
                throw new Error('"options" is undefined.');
            }
            else if (!view.options.am_cert_hash) {
                // Error, am_cert_hash is required.
                throw new Error('"am_cert_hash" is undefined.');
            }
            else if (!view.options.rowitem_uuid) {
                // Error, rowitem_uuid is required.
                throw new Error('"rowitem_uuid" is undefined.');
            }
            else if (!view.options.cluster_uuid) {
                // Error, cluster_uuid is required.
                throw new Error('"cluster_uuid" is undefined.');
            }

            // Create a new model for the acquisition data.
            view.model = new AgentTask({
                am_cert_hash: options.am_cert_hash,
                cluster_uuid: options.cluster_uuid,
                cluster_name: options.cluster_name,
                rowitem_uuid: options.rowitem_uuid,
                identity: options.identity
            });
        },
        serializeData: function () {
            var view = this;

            var data = view.model.toJSON();

            // Determine whether credentials exist for this cluster.
            var credentials = new ClusterCredentialsModel({
                cluster_uuid: view.options.cluster_uuid
            });
            credentials.fetch({
                async: false,
                failure: function (model, response) {
                    utils.display_error('Exception while retrieving cached data - ' + JSON.stringify(response));
                }
            });
            view.use_cached = credentials.get('found');
            console.log('Password cached for cluster: ' + view.options.cluster_name + ': ' + view.use_cached);

            var selection = view.options.selection;
            var file_path = '%systemroot%\\system32';
            var file_name = '';
            if (selection) {
                // Parse out the path and name of the file.
                selection = _.strip(selection);

                var parts = selection.split("\\");

                if (parts.length <= 1) {
                    file_name = parts.pop();
                }
                else {
                    file_name = parts.pop();
                    file_path = parts.join("\\");
                }
            }
            else {
                // Error
                throw('Error creating acquisition, nothing selected.');
            }

            data['file_path'] = file_path;
            data['file_name'] = file_name;
            data['use_cached'] = view.use_cached;

            return data;
        },
        onRender: function () {
            var view = this;
            // Display the form to the user.
            view.$('#acquire-form').modal({
                backdrop: false
            });

            if (view.use_cached) {
                // Disable the user and password fields.
                view.$('#use_cached').prop('checked', true);
                view.enable_disable_credentials()
            }
        },
        /**
         * Enable or disable the user and password field based on the use_cached field.
         */
        enable_disable_credentials: function () {
            var disabled = this.$('#use_cached').is(':checked');
            this.$('#user').prop('disabled', disabled);
            this.$('#password').prop('disabled', disabled);
        },
        acquire: function () {
            var view = this;
            var acquire_form = view.$('#acquire-form', 'Processing...');

            try {
                // Immediately block to prevent multiple submissions.
                utils.block();

                view.model.set('uuid', undefined);
                view.model.set('file_path', view.$('#file_path').val());
                view.model.set('file_name', view.$('#file_name').val());
                view.model.set('method', view.$('#method').val());
                view.model.set('comment', view.$('#comment').val());
                view.model.set('user', view.$('#user').val());
                view.model.set('password', view.$('#password').val());
                view.model.set('force', view.$("#force").is(":checked"));
                // TODO: Rename this on the server.
                view.model.set('credentials_cached', $('#use_cached').is(':checked'));

                if (!view.model.isValid()) {
                    var errors = view.model.validationError;
                    _.each(errors, function (error) {
                        utils.display_error(error);
                    });

                    return; // **EXIT**
                }
            }
            finally {
                // Unblock before starting the AJAX call.
                utils.unblock();
            }

            utils.block();

            view.model.save({}, {
                success: function (model, response, options) {
                    try {
                        // Attempt to wait for a response that the acquisition was sucessfull submitted.
                        sf_utils.wait_for_acquisition(response.uuid, function (err, is_complete) {
                            // Unblock the UI.
                            utils.unblock();

                            if (err) {
                                // Error.
                                utils.display_error('There was in error submitting the acquisition request: ' + err);
                            }
                            else if (is_complete) {
                                utils.display_success('The acquisition request has successfully been submitted.');
                                // Notify that a suppression was created.
                                vent.trigger(StrikeFinderEvents.SF_ACQUIRE_CREATE, view.model);
                                view.trigger('create', view.model);
                                // Hide the dialog.
                                view.$(acquire_form).modal('hide');
                            }
                            else {
                                // The request was not complete, view on the suppressions list.
                                utils.display_info('The acqusition request is still being processed, its status ' +
                                    'can be viewed on the <a href="/sf/acquisitions">Acquisitions List</a>.');
                                // Notify that a suppression was created.  It has not completed yet though this event should
                                // be fired to ensure the relevant fields in the UI are updated.
                                view.trigger('create', view.model);
                                vent.trigger(StrikeFinderEvents.SF_ACQUIRE_CREATE, view.model);
                                // Hide the dialog.
                                view.$(acquire_form).modal('hide');
                            }
                        });
                    }
                    catch (e) {
                        // Error, leave the dialog displayed.
                        utils.unblock();
                    }
                },
                error: function (model, response) {
                    try {
                        utils.display_response_error(model, response);
                    }
                    finally {
                        utils.unblock();
                    }
                }
            });
        },
        //
        // Cancel the acquire form dialog.
        //
        cancel: function () {
            this.$("#acquire-form").modal("hide");
            // Notify that the dialog was canceled.
            this.trigger('cancel');
            // Close the view.
            this.close();
        }
    });

    return AcquireFormView;
});