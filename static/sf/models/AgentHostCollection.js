define(function (require) {
    var Backbone = require('backbone');
    var AgentHostModel = require('sf/models/AgentHostModel');

    AgentHostCollection = Backbone.Collection.extend({
        initialize: function (models, options) {
            if (this.options) {
                if (options.am_cert_hash) {
                    this.am_cert_hash = options.am_cert_hash;
                }
                else if (options.host) {
                    this.host = options.host;
                }
            }
        },
        model: AgentHostModel,
        url: function () {
            if (this.am_cert_hash) {
                return _.sprintf('/sf/api/host/hash/%s', this.am_cert_hash);
            }
            else if (this.hosts) {
                if (this.hosts.indexOf('.')) {
                    return _.sprintf('api/v1/agent/?limit=100&ip=%s', this.hosts);
                }
                else {
                    return _.sprintf('api/v1/agent/?limit=100&hostname__in=%s', this.hosts);
                }
            }
            else {
                log.error('Expecting am_cert_hash or hosts to be set.');
            }
        },
        parse: function (response, options) {
            // TODO: The counts need to be merged back in!
            if (this.am_cert_hash) {
                var objects = response.objects;
                if (response.objects && response.objects.length == 1) {
                    return objects[0];
                }
                else {
                    log.warn('Found multiple return values for am_cert_hash: ' + this.am_cert_hash);
                    return null;
                }
            }
            else if (response.objects) {
                return response.objects;
            }
            else {
                return [];
            }
        }
    });

    return AgentHostCollection
});