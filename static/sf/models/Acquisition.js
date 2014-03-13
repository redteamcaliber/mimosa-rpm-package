define(function (require) {
    var Backbone = require('backbone');
    var utils = require('sf/common/utils');

    /**
     * Model for a single acquisisition.
     */
    Acquisition = Backbone.Model.extend({
        idAttribute: 'uuid',
        defaults: {
            am_cert_hash: '',
            cluster_uuid: '',
            file_path: '',
            file_name: '',
            method: 'api',
            comment: '',
            user: '',
            password: '',
            force: ''
        },
        url: function () {
            if (this.uuid) {
                return _.sprintf('/sf/api/acquisitions/%s', this.uuid);
            }
            else {
                return '/sf/api/acquisitions';
            }
        },
        validate: function (attr, options) {
            var results = [];
            if (_.isEmpty(attr.am_cert_hash)) {
                results.push('"am_cert_hash" is required.');
            }
            if (_.isEmpty(attr.cluster_uuid)) {
                results.push('"cluster_uuid" is required.');
            }
            if (_.isEmpty(attr.method)) {
                results.push('"method" is required.');
            }
            if (!attr.credentials_cached) {
                // User and password are required if the clusters credentials have not been cached.
                if (_.isEmpty(attr.user)) {
                    results.push('"user" is required.');
                }
                if (_.isEmpty(attr.password)) {
                    results.push('"password" is required.');
                }
            }
            if (_.isEmpty(attr.file_path)) {
                results.push('"file path" is required.');
            }
            if (_.isEmpty(attr.file_name)) {
                results.push('"file name" is required.');
            }
            if (results.length > 0) {
                return results;
            }
            else {
                return null;
            }
        },
        /**
         * Return a formatted String value for this acquisition.
         * @returns {String} - a formatted String.
         */
        toString: function() {
            return utils.format_acquisition(this.attributes);
        }
    });

    return Acquisition;
});
