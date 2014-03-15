define(function (require) {
    var Backbone = require('backbone');

    var AgentHostModel = Backbone.Model.extend({
        defaults: {
            cluster: {
                name: ''
            },
            domain: '',
            drives: '',
            gmt_offset: '',
            hash: '',
            hostname: '',
            ip: '',
            logged_on_user: '',
            mac_address: '',
            machine: '',
            os_bitness: '',
            os_buildnumber: '',
            os_patch_level: '',
            port: 0,
            proc_type: '',
            processor: '',
            product_name: '',
            resource_uri: '',
            revision: '',
            time_logged: '',
            time_zone_dst: '',
            time_zone_standard: '',
            total_physical_ram: '',
            uuid: '',
            version: ''
        },
        idAttribute: 'hash',
        urlRoot: '/sf/api/hosts/hash/'
    });

    return AgentHostModel;
});