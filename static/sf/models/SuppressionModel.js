define(function (require) {
    var Backbone = require('backbone');
    var utils = require('sf/common/utils');

    /**
     * Suppressions create/update/delete model.
     */
    SuppressionModel = Backbone.Model.extend({
        defaults: {
            exp_key: '',
            itemkey: '',
            itemvalue: '',
            condition: '',
            preservecase: false,
            negate: false,
            rowitem_type: '',
            comment: ''
        },
        idAttribute: 'suppression_id',
        url: "/sf/api/suppressions",
        as_string: function () {
            return utils.format_suppression(this.attributes);
        },
        validate: function (attr, options) {
            var results = [];
            if (_.isEmpty(attr.exp_key)) {
                results.push('exp_key is required.');
            }
            if (_.isEmpty(attr.comment)) {
                results.push('Name is required.');
            }
            if (_.isEmpty(attr.condition)) {
                results.push('Condition is required.');
            }
            if (_.isEmpty(attr.itemkey)) {
                results.push('Term is required.');
            }
            if (_.isEmpty(attr.itemvalue)) {
                results.push('Suppression text is required.');
            }
            if (results.length > 0) {
                return results;
            }
        }
    });

    return SuppressionModel;
});