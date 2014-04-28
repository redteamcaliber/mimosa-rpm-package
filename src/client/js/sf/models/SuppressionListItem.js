define(function (require) {
    var Backbone = require('backbone');
    var utils = require('sf/common/utils');

    /**
     * Model representing a suppression list item.  Currently the suppression list API returns different results than the
     * create/edit API.
     */
    var SuppressionListItem = Backbone.Model.extend({
        defaults: {
            suppression_id: 0,
            suppressed: 0,
            iochit_id: 0,
            user_uuid: '',
            comment: '',
            itemkey: '',
            itemvalue: '',
            condition: '',
            preservecase: false,
            cluster_uuid: '',
            cluster_name: '',
            negate: false,
            created: '',
            exp_key: '',
            details: '',
            ioc_uuid: '',
            iocname: '',
            iocnamehash: ''
        },
        idAttribute: 'suppression_id',
        urlRoot: '/sf/api/suppressions',
        as_string: function () {
            return utils.format_suppression(this.attributes);
        }
    });

    return SuppressionListItem;
});
