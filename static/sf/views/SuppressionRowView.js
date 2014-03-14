define(function (require) {
    var View = require('uac/views/View');
    var templates = require('sf/ejs/templates');
    var sf_utils = require('sf/common/utils');

    /**
     * View representing a row of the suppressions table view.
     */
    SuppressionRowView = View.extend({
        events: {
            'click i.destroy': 'on_delete'
        },
        initialize: function(options) {
            var view = this;
            var link = window.location.protocol + '//' + window.location.hostname +
                (window.location.port ? ':' + window.location.port : '') + '/sf/suppressions/' + this.model.get('suppression_id');
            view.apply_template(templates, 'link.ejs', {link: link});

            var button = view.$el.find('i.link');
            button.popover({
                html : true,
                trigger: 'manual',
                content: html
            })
                .data('bs.popover')
                .tip()
                .addClass('link-popover');
            button.on('click', function(ev) {
                button.popover('toggle');
                $('.link-text').select();
                return false;
            });
        },
        on_delete: function (ev) {
            var view = this;
            var message = _.sprintf('Delete suppression: %s', view.model.as_string());
            if (confirm(message)) {
                view.model.destroy({
                    success: function (model, response, options) {
                        // The task was submitted successfully to delete the suppression.
                        var response_object = JSON.parse(response);
                        var task_id = response_object.task_id;

                        // Block the UI while deleting.
                        view.block();

                        view.display_success('Submitted task for delete suppression: ' + view.model.as_string());

                        // Try and wait for the task to complete.
                        sf_utils.wait_for_task(response_object.task_id, function(err, completed, response) {
                            // Unblock the UI.
                            view.unblock();

                            if (err) {
                                // Error checking the task result.
                                view.display_error(err);
                            }
                            else if (completed) {
                                // The task was completed successfully.
                                view.display_success('Successfully deleted suppression: ' +
                                    view.model.as_string());

                                // Notify that the suppression was deleted.
                                view.trigger('delete', view.model);
                            }
                            else {
                                // The task is still running.
                                var task_message = _.sprintf('The task deleting suppression: %s is still running and ' +
                                    'its results can be viewed on the <a href="/sf/tasks">Task List</a>.',
                                    view.model.as_string());
                                view.display_info(task_message);
                            }
                        });
                    },
                    error: function(model, xhr) {
                        // Error submitting the task.
                        try {
                            var message = xhr && xhr.responseText ? xhr.responseText : 'Response text not defined.';
                            view.display_error('Error while submitting delete suppression task - ' + message);
                        }
                        finally {
                            view.unblock();
                        }
                    }
                });
            }
        },
        close: function () {
            console.log('Closing row view...');
            this.$el.find('i.link').popover('destroy');
            // Manually removing the popover due to -> https://github.com/twbs/bootstrap/issues/10335
            this.$el.parent().find('.popover').remove();
            this.remove();
        }
    });

    return SuppressionRowView;
});