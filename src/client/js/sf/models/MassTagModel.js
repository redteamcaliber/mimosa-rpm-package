define(function (require) {
    var Backbone = require('backbone');

    /**
     * Mass Tagging Model
     */
    var MassTagModel = Backbone.Model.extend({
        defaults: {
            tagname: '',
            am_cert_hash: '',
            cluster_uuid: '',
            exp_key: '',
            itemkey: '',
            condition: '',
            itemvalue: '',
            preservecase: false,
            negate: false,
            rowitem_type: '',
            perform_updates: false,
            comment: ''
        },
        as_string: function () {
            return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s, negate=%s)',
                this.get('itemkey'),
                this.get('condition'),
                this.get('itemvalue'),
                this.get('preservecase'),
                this.get('negate'));
        },
        url: "/sf/api/hits/masstag",
        validate: function (attr, options) {
            var results = [];
            if (_.isEmpty(attr.tagname)) {
                results.push('"tagname" is required.');
            }
            if (_.isEmpty(attr.exp_key)) {
                results.push('"expression" is required.');
            }
            if (_.isEmpty(attr.itemkey)) {
                results.push('"term" is required.');
            }
            if (_.isEmpty(attr.condition)) {
                results.push('"condition" is required.');
            }
            if (_.isEmpty(attr.itemvalue)) {
                results.push('"value" is required.');
            }
            if (_.isEmpty(attr.rowitem_type)) {
                results.push('"rowitem_type" is required.');
            }
            if (_.isEmpty(attr.comment)) {
                results.push('"comment" is required.');
            }

            if (results.length > 0) {
                return results;
            }
        }
    });

    return MassTagModel;
});
