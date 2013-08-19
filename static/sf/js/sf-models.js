var StrikeFinder = StrikeFinder || {};

//
// ----------- Models/Collections ----------
//

/**
 * Base list item class.
 */
StrikeFinder.ListItemModel = Backbone.Model.extend({
    defaults: {
        selected: false
    }
});

/**
 * Model to represent an MCIRT service.
 */
StrikeFinder.ServiceModel = StrikeFinder.ListItemModel.extend({
    defaults: {
        id: "",
        name: ""
    }
});

/**
 * Collection of services.
 */
StrikeFinder.ServicesCollection = Backbone.Collection.extend({
    model: StrikeFinder.ServiceModel,
    url: '/sf/api/services'
});

/**
 * Model to represent a cluster.
 */
StrikeFinder.ClusterModel = StrikeFinder.ListItemModel.extend({
    defaults: {
        client_uuid: "",
        client_name: "",
        cluster_uuid: "",
        cluster_name: "",
        node_band: 0
    }
});

/**
 * Collection of clusters.
 */
StrikeFinder.ClustersCollection = Backbone.Collection.extend({
    model: StrikeFinder.ClusterModel,
    url: '/sf/api/clusters'
});

StrikeFinder.IOCSummaryModel = Backbone.Model.extend({
    defaults: {
        suppressed: 0,
        totalexpressions: 0,
        iocname: '',
        checkedoutexpressions: 0,
        closed: 0,
        iocnamehash: '',
        open: 0
    }
});
StrikeFinder.IOCSummaryCollection = Backbone.Collection.extend({
    url: '/sf/api/ioc-summary',
    model: StrikeFinder.IOCSummaryModel
});

/**
 * Model that represents an IOC details item on the shopping view.
 */
StrikeFinder.IOCDetailsModel = Backbone.Model.extend({
    defaults: {
        iocuid: "",
        expressions: []
    }
});
StrikeFinder.IOCDetailsCollection = Backbone.Collection.extend({
    url: '/sf/api/ioc-summary',
    model: StrikeFinder.IOCDetailsModel,
    parse: function(response, options) {
        if (response && response.length > 0) {
            var ioc_uuids = [];
            var ioc_uuid_map = {};
            _.each(response, function(item) {
                if (_.indexOf(ioc_uuids, item.iocuuid) == -1) {
                    ioc_uuids.push(item.iocuuid);
                }
                if (!_.has(ioc_uuid_map, item.iocuuid)) {
                    ioc_uuid_map[item.iocuuid] = [];
                }
                ioc_uuid_map[item.iocuuid].push(item);
            });

            results = [];
            _.each(ioc_uuids, function(ioc_uuid) {
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

/**
 * Model for checking out user tokens.
 */
StrikeFinder.UserCriteriaModel = Backbone.Model.extend({
    defaults: {
        checkout: true,
        services: [],
        clusters: [],
        iocname: '',
        iocnamehash: '',
        exp_key: [],
        usertoken: ''
    },
    urlRoot: '/sf/api/usersettings',
    parse: function (response, options) {
        // Ensure that services and clusters are always array values.
        if (response['services'] && !_.isArray(response['services'])) {
            response['services'] = [response['services']];
        }
        if (response['clusters'] && !_.isArray(response['clusters'])) {
            response['clusters'] = [response['clusters']];
        }
        return response;
    },
    initialize: function () {
        this.listenTo(this, "change", this.on_change);
    },
    on_change: function (ev) {
        if (log.isDebugEnabled()) {
            log.debug("change::" + JSON.stringify(ev.changedAttributes()));
        }
    },
    is_required_params_set: function () {
        var selected_services = this.get("services");
        var selected_clusters = this.get("clusters");
        return selected_services && selected_services.length > 0 && selected_clusters && selected_clusters.length > 0;
    },
    get_params: function () {
        // Retrieve the parameters flattening all array values to comma delimited strings.
        var that = this;
        var results = {};
        _.each(_.keys(this.attributes), function (key) {
            var value = that.get(key);
            if (_.isArray(value)) {
                results[key] = value.join();
            }
            else {
                results[key] = value;
            }
        });
        return results;
    }
});

StrikeFinder.HitsModel = Backbone.Model.extend({
});
StrikeFinder.HitsCollection = Backbone.Collection.extend({
    initialize: function (models, options) {
        if (options) {
            if ('tagname' in options) {
                this.tagname = options['tagname'];
            }
            else if ('usertoken' in options) {
                this.usertoken = options['usertoken'];
            }
            else if ('suppression_id' in options) {
                this.suppression_id = options['suppression_id'];
            }
            else if ('am_cert_hash' in options) {
                this.am_cert_hash = options['am_cert_hash'];
            }
        }
    },
    model: StrikeFinder.HitsModel,
    url: function () {
        var url = '/sf/api/hits';
        if (this.tagname) {
            url += '?tagname=' + this.tagname;
        }
        else if (this.usertoken) {
            url += '?usertoken=' + this.usertoken;
        }
        else if (this.suppression_id) {
            url += '?suppression_id=' + this.suppression_id;
        }
        else if (this.am_cert_hash) {
            url += '?am_cert_hash=' + this.am_cert_hash;
        }
        return url;
    },
    parse: function(response, options) {
        return response.results ? response.results : [];
    }
});

/**
 * Model that represents and IOC information object.
 */
StrikeFinder.IOCModel = Backbone.Model.extend({
    defaults: {
        ioc_md5sum: "",
        name: "",
        content: "",
        exp_key: "",
        ioc_uid: "",
        details: "",
        iocnamehash: "",
        uuid: 0
    }
});
StrikeFinder.IOCCollection = Backbone.Collection.extend({
    initialize: function (models, options) {
        this.rowitem_uuid = options["rowitem_uuid"];
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/iocs', this.rowitem_uuid);
    },
    model: StrikeFinder.IOCModel
});

/**
 * File/Info Details Model.
 */
StrikeFinder.FileInfoModel = Backbone.Model.extend({
    defaults: {
        html: ""
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/html', this.id);
    }
});

/**
 * Model representing an IOC term.
 */
StrikeFinder.IOCTermsModel = Backbone.Model.extend({
    defaults: {
        uuid: "",
        data_type: "",
        source: "",
        text: "",
        text_prefix: "",
        title: ""
    }
});
StrikeFinder.IOCTermsCollection = Backbone.Collection.extend({
    initialize: function (models, options) {
        this.rowitem_type = options["rowitem_type"];
    },
    model: StrikeFinder.IOCTermsModel,
    url: function () {
        return _.sprintf("/api/iocterms/%s", this.rowitem_type);
    }
});

StrikeFinder.format_suppression = function(s) {
    return _.sprintf('%s \'%s\' \'%s\' (preservecase=%s)', s.itemkey, s.itemvalue, s.condition, s.preservecase);
};

/**
 * Model representing a suppression list item.  Currently the suppression list API returns different results than the
 * create/edit API.
 */
StrikeFinder.SuppressionListItem = Backbone.Model.extend({
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
        ioc_uid: '',
        iocname: '',
        iocnamehash: ''
    },
    idAttribute: 'suppression_id',
    urlRoot: '/sf/api/suppressions'
});
StrikeFinder.SuppressionListItemCollection = Backbone.Collection.extend({
    model: StrikeFinder.SuppressionListItem,
    initialize: function (models, options) {
        if (options) {
            this.exp_key = options['exp_key'];
        }
        else {
            this.exp_key = null;
        }
    },
    url: function () {
        if (this.exp_key) {
            return _.sprintf('/sf/api/suppressions?exp_key=%s', this.exp_key);
        }
        else {
            return '/sf/api/suppressions';
        }
    },
    parse: function(response, options) {
        _.each(response, function(item) {
            item.formatted = StrikeFinder.format_suppression(item);
        });
        return response;
    }
});

StrikeFinder.AcquireModel = Backbone.Model.extend({
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
    url: '/sf/api/acquire',
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
        if (_.isEmpty(attr.user)) {
            results.push('"user" is required.');
        }
        if (_.isEmpty(attr.password)) {
            results.push('"password is required.');
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
    }
});

/**
 * Suppressions create/update/delete model.
 */
StrikeFinder.SuppressionModel = Backbone.Model.extend({
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
        return StrikeFinder.format_suppression(this.attributes);
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

/**
 * Mass Tagging Model
 */
StrikeFinder.MassTagModel = Backbone.Model.extend({
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

/**
 * Comment model.
 */
StrikeFinder.CommentsModel = Backbone.Model.extend({
    defaults: {
        comment: "",
        created: "",
        user_uuid: "",
        rowitem_uuid: "",
        token: "",
        type: ""
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/addcomment', this.get('rowitem_uuid'));
    }
});
StrikeFinder.CommentsCollection = Backbone.Collection.extend({
    model: StrikeFinder.CommentsModel,
    initialize: function (models, options) {
        this.rowitem_uuid = options["rowitem_uuid"];
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/comments', this.rowitem_uuid);
    }
});

StrikeFinder.TagModel = Backbone.Model.extend({
    defaults: {
        id: 0,
        name: '',
        title: '',
        description: '',
        image: ''
    }
});
StrikeFinder.TagCollection = Backbone.Collection.extend({
    initialize: function(models, options) {
        if (options && options.searchable) {
            this.searchable = true;
        }
    },
    model: StrikeFinder.TagModel,
    url: '/sf/api/tags',
    parse: function(response, options) {
        if (this.searchable) {
            var results = [];
            _.each(response, function(tag) {
                if (tag.name != 'notreviewed') {
                    results.push(tag);
                }
            });
            return results;
        }
        else {
            return response;
        }
    }
});

StrikeFinder.SetTagModel = Backbone.Model.extend({
    defaults: {
        rowitem_uuid: '',
        tagname: ''
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/settag', this.get('rowitem_uuid'));
    }
});

StrikeFinder.AgentHostModel = Backbone.Model.extend({
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
StrikeFinder.AgentHostCollection = Backbone.Collection.extend({
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
    model: StrikeFinder.AgentHostModel,
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
    parse: function(response, options) {
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

StrikeFinder.ClientModel = Backbone.Model.extend({
    defaults: {
        uuid: '',
        alias: '',
        name: ''
    }
});
StrikeFinder.ClientCollection = Backbone.Collection.extend({
    url: '/sf/api/clients',
    model: StrikeFinder.ClientModel
});
