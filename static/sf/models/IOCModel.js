define(function(require) {
    var Backbone = require('backbone');

    /**
     * Model that represents and IOC information object.
     */
    IOCModel = Backbone.Model.extend({
        defaults: {
            ioc_md5sum: "",
            name: "",
            content: "",
            exp_key: "",
            ioc_uuid: "",
            details: "",
            iocnamehash: "",
            uuid: 0
        }
    });

    return IOCModel;
});