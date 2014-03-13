define(function(require) {
    var Backbone = require('backbone');
    var IOCDetailsModel = require('sf/models/IOCDetailsModel');

    IOCDetailsCollection = Backbone.Collection.extend({
        url: '/sf/api/ioc-summary',
        model: IOCDetailsModel,
        parse: function (response, options) {
            if (response && response.length > 0) {
                var ioc_uuids = [];
                var ioc_uuid_map = {};
                _.each(response, function (item) {
                    if (_.indexOf(ioc_uuids, item.iocuuid) == -1) {
                        ioc_uuids.push(item.iocuuid);
                    }
                    if (!_.has(ioc_uuid_map, item.iocuuid)) {
                        ioc_uuid_map[item.iocuuid] = [];
                    }
                    ioc_uuid_map[item.iocuuid].push(item);
                });

                results = [];
                _.each(ioc_uuids, function (ioc_uuid) {
                    results.push({
                        iocuuid: ioc_uuid,
                        expressions: ioc_uuid_map[ioc_uuid]
                    });
                });

                return results;
            }
            else {
                return [];
            }
        }
    });

    return IOCDetailsCollection;
});
