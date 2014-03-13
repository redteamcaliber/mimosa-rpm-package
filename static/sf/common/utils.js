define(function(require) {
    var utils = require('uac/common/utils');
    var session = require('uac/common/session');
    var TagCollection = require('sf/models/TagCollection');

    /**
     * Retrieve the list of StrikeFinder tags.
     * @param callback - function(err, tags).
     */
    get_tags = function (callback) {
        var tags = session('strikefinder.tags');
        if (tags) {
            callback(null, tags);
        }
        else {
            var c = new TagCollection();
            c.fetch({
                success: function (collection, response, options) {
                    // Cache the tags for later use.
                    var tags = c.toJSON();
                    session('strikefinder.tags', tags);
                    callback(null, tags);
                },
                error: function (collection, response, options) {
                    callback(response);
                }
            });
        }
    };

    format_suppression = function (s) {
        return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s, negate: %s)',
            s.itemkey, s.condition, _.escape(s.itemvalue), s.preservecase, s.negate);
    };

    format_acquisition = function (a) {
        return _.sprintf('Acquisition (%s) FilePath: %s FileName: %s',
            a.uuid, a.file_path, a.file_name);
    };

    /**
     * Wait for a task result to complete polling fn(callback) until done is true.  A callback is passed into fn() to
     * specify that the process is completed invoke callback(true) or callback(false) otherwise.
     * @param task_id - the task to wait for.
     * @param callback - function(err, complete, result).
     */
    wait_for_task = function(task_id, callback) {
        utils.wait_for({
                task_id: task_id
            },
            function(params, callback) {
                var task = new StrikeFinder.Task({
                    id: task_id
                });
                task.fetch({
                    success: function(model, response) {
                        if (response.state == 'SUCCESS') {
                            // The task was successful.
                            callback(null, true, response);
                        } else if (response.state == 'FAILURE') {
                            // The task failed, there is currently no error message to pass along.
                            callback('There was an error submitting the task.');
                        } else {
                            // Continue polling.
                            callback(null, false);
                        }
                    },
                    error: function(model, response) {
                        // Error while looking up task result.
                        clearInterval(interval);
                        callback('Error while checking on task result: ' + task_id);
                    }
                });
            },
            callback
        );
    };

    wait_for_acquisition = function(acquisition_uuid, callback) {
        utils.wait_for({
                acquisition_uuid: acquisition_uuid
            },
            function(params, callback) {
                var acquisition = new StrikeFinder.Acquisition();
                acquisition.uuid = acquisition_uuid;
                acquisition.fetch({
                    success: function(model, response) {
                        if (response.state == 'created' || response.state == 'started') {
                            // The acquisition request is successful.
                            callback(null, true, response);
                        } else if (response.state == 'errored') {
                            // The acquisition request failed.
                            if (response.error_message) {
                                // The acquisition request failed with an exception reported.  Seasick is generally
                                // putting an exception condition in the 'exc' field.
                                callback(response.error_message);
                            } else {
                                // The acquisition request failed though there was no exception information.
                                callback(JSON.stringify(response));
                            }
                        } else {
                            // Continue polling.
                            callback(null, false);
                        }
                    },
                    error: function(model, response) {
                        // Error while looking up task result.
                        callback('Error while checking on acquisition status: ' + acquisition_uuid);
                    }
                });
            },
            callback
        );
    };

    return {
        get_tags: get_tags,
        format_suppression: format_suppression,
        format_acquisition: format_acquisition,
        wait_for_task: wait_for_task,
        wait_for_acquisition: wait_for_acquisition
    }
});
