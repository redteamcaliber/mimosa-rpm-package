define(function(require) {
    var async = require('async');
    var View = require('uac/views/View');

    var utils = require('sf/common/utils');
    var templates = require('sf/ejs/templates');

    var ClusterCredentialsModel = require('sf/models/ClusterCredentialsModel');
    var Acquisition = require('sf/models/Acquisition');

    /**
     * Acquisition input form.
     */
    var AcquireFormView = View.extend({
        render: function(params) {
            var view = this;

            view.close();

            console.log('Rendering acquire form view...');
            console.log('params: ' + JSON.stringify(params));

            if (!params) {
                // Error, params are required.
                throw new Error('"params" is undefined.');
            } else if (!params.am_cert_hash) {
                // Error, am_cert_hash is required.
                throw new Error('"am_cert_hash" is undefined.');
            } else if (!params.rowitem_uuid) {
                // Error, rowitem_uuid is required.
                throw new Error('"rowitem_uuid" is undefined.');
            } else if (!params.cluster_uuid) {
                // Error, cluster_uuid is required.
                throw new Error('"cluster_uuid" is undefined.');
            }

            async.waterfall([

                function(callback) {
                    // Determine whether credentials exist for this cluster.
                    var credentials = new ClusterCredentialsModel({
                        cluster_uuid: params.cluster_uuid
                    });
                    credentials.fetch({
                        success: function(model) {
                            callback(null, model);
                        },
                        failure: function(model, response) {
                            // Error.
                            callback('Exception while retrieving cached data - ' + JSON.stringify(response));
                        }
                    })
                },
                function(cluster_credentials_model, callback) {
                    var use_cached = cluster_credentials_model.get('found');

                    console.log('Password cached for cluster: ' + params.cluster_name + ': ' + use_cached);

                    // Display the form.
                    var selection = params['selection'];
                    var file_path = '%systemroot%\\system32';
                    var file_name = '';
                    if (selection) {
                        // Parse out the path and name of the file.
                        selection = _.strip(selection);

                        var parts = selection.split("\\");

                        if (parts.length <= 1) {
                            file_name = parts.pop();
                        } else {
                            file_name = parts.pop();
                            file_path = parts.join("\\");
                        }
                    } else {
                        // Error
                        view.error('Nothing selected.');
                        return;
                    }

                    // Create a new model for the acquisition data.
                    view.model = new Acquisition({
                        am_cert_hash: params.am_cert_hash,
                        cluster_uuid: params.cluster_uuid,
                        cluster_name: params.cluster_name,
                        rowitem_uuid: params.rowitem_uuid,
                        identity: params.identity
                    });

                    var data = view.model.toJSON();
                    data['file_path'] = file_path;
                    data['file_name'] = file_name;
                    data['use_cached'] = use_cached;

                    // Display the acquire template.
                    view.apply_template(templates, 'acquire-form.ejs', data);

                    // Register events.
                    view.delegateEvents({
                        'click #acquire': 'acquire',
                        'click #cancel': 'cancel',
                        'change #use_cached': 'enable_disable_credentials'
                    });

                    if (use_cached) {
                        // Disable the user and password fields.
                        view.$('#use_cached').prop('checked', true);
                        view.enable_disable_credentials()
                    }

                    // Display the form to the user.
                    view.$('#acquire-form').modal({
                        backdrop: false
                    });

                    callback();
                }
            ],
                function(err) {
                    if (err) {
                        // Error
                        view.display_error(err);
                    }
                }
            );
        },
        /**
         * Enable or disable the user and password field based on the use_cached field.
         */
        enable_disable_credentials: function() {
            var disabled = this.$('#use_cached').is(':checked');
            this.$('#user').prop('disabled', disabled);
            this.$('#password').prop('disabled', disabled);
        },
        acquire: function() {
            var view = this;
            var acquire_form = view.$('#acquire-form', 'Processing...');

            try {
                // Immediately block to prevent multiple submissions.
                view.block_element(acquire_form);

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
                    _.each(errors, function(error) {
                        view.display_error(error);
                    });

                    return; // **EXIT**
                }
            } finally {
                // Unblock before starting the AJAX call.
                view.unblock(acquire_form);
            }

            view.block_element(acquire_form, 'Processing...');

            view.model.save({}, {
                success: function(model, response, options) {
                    try {
                        // Attempt to wait for a response that the acquisition was sucessfull submitted.
                        utils.wait_for_acquisition(response.uuid, function(err, is_complete) {
                            // Unblock the UI.
                            view.unblock(acquire_form);

                            if (err) {
                                // Error.
                                view.display_error('There was in error submitting the acquisition request: ' + err);
                            } else if (is_complete) {
                                view.display_success('The acquisition request has successfully been submitted.');
                                // Notify that a suppression was created.
                                view.trigger('create', view.model);
                                // Hide the dialog.
                                view.$(acquire_form).modal('hide');
                            } else {
                                // The request was not complete, view on the suppressions list.
                                view.display_info('The acqusition request is still being processed, its status ' +
                                    'can be viewed on the <a href="/sf/acquisitions">Acquisitions List</a>.');
                                // Notify that a suppression was created.  It has not completed yet though this event should
                                // be fired to ensure the relevant fields in the UI are updated.
                                view.trigger('create', view.model);
                                // Hide the dialog.
                                view.$(acquire_form).modal('hide');
                            }
                        });
                    } catch (e) {
                        // Error, leave the dialog displayed.
                        view.unblock(acquire_form);
                    }
                },
                error: function(model, xhr, options) {
                    try {
                        var err;
                        if (xhr && xhr.responseText) {
                            try {
                                var parsed = JSON.parse(xhr.responseText);
                                if (parsed.error) {
                                    err = parsed.error;
                                } else {
                                    err = parsed;
                                }
                            } catch (e) {
                                // Error parsing the response.
                                err = xhr.responseText;
                            }
                        }
                        view.display_error('Error submitting acquisition request' +
                            (err ? ' - ' + err : ''));
                    } finally {
                        view.unblock(acquire_form);
                    }
                }
            });
        },
        /**
         * Cancel the acquire form dialog.
         */
        cancel: function() {
            this.$("#acquire-form").modal("hide");
            // Notify that the dialog was canceled.
            this.trigger('cancel');
        },
        close: function() {
            var view = this;
            // Remove any listeners.
            view.undelegateEvents();
        }
    });

    return AcquireFormView;
});