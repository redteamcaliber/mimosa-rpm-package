var StrikeFinder = StrikeFinder || {};

//
// ----------- Models/Collections ----------
//

StrikeFinder.get_tags = function (callback) {
    var tags = UAC.session('strikefinder.tags');
    if (tags) {
        callback(null, tags);
    }
    else {
        c = new StrikeFinder.TagCollection();
        c.fetch({
            success: function (collection, response, options) {
                // Cache the tags for later use.
                var tags = c.toJSON();
                UAC.session('strikefinder.tags', tags);
                callback(null, tags);
            },
            error: function (collection, response, options) {
                callback(response);
            }
        });
    }
};

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

/**
 * Model for checking out user tokens.
 */
StrikeFinder.UserCriteriaModel = Backbone.Model.extend({
    defaults: {
        services: [],
        clusters: []
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
    parse: function (response, options) {
        return response.results ? response.results : [];
    }
});

/**
 * Generic model to store hits criteria.  This model currently transient and does not connect to the server.
 */
StrikeFinder.HitsCriteria = Backbone.Model.extend({
    _defaults: {
        services: [],
        clusters: [],
        exp_key: [],
        usertoken: [],
        iocnamehash: [],
        ioc_uuid: [],
        am_cert_hash: [],
        suppression_id: [],
        tagname: []
    },
    defaults: this._defaults,
    is_param: function (k, v) {
        return this.attributes &&
            _.has(this.attributes, k) &&
            this.attributes[k] == v;
    },
    /**
     * Add value to the list associated with the key.  Adds the list if it does not exist.
     * @param k - the criteria key.
     * @param v - the criteria value.
     */
    add: function (k, v) {
        var values = this.get(k);
        // Only add the parameter once to the list of values.
        if (values && values.indexOf(v) == -1) {
            values.push(v);
        }
        else {
            values = [v];
            this.set(k, values);
        }
    },
    /**
     * Remove a criteria key and value.
     * @param k - the criteria key.
     * @param v - the criteria value.
     */
    remove: function (k, v) {
        if (!this.is_initial(k, v)) {
            // Only remove parameters that are not part of the initial set.
            var values = this.get(k);
            if (values && values.length > 0) {
                var value_index = values.indexOf(v);
                if (value_index != -1) {
                    // Remove the value
                    values.splice(value_index, 1);
                }
            }
        }
    },
    is_initial: function (k, v) {
        return this.initial_params &&
            _.has(this.initial_params, k) &&
            this.initial_params[k] == v;
    },
    /**
     * Store and set the initial parameters on this model.  These parameters should survive a model reset.
     * @param initial_params - the map of parameters.
     */
    set_initial: function (initial_params) {
        var view = this;
        view.clear();
        view.initial_params = initial_params;
        _.each(_.keys(initial_params), function (key) {
            view.set(key, initial_params[key]);
        });
    },
    /**
     * Reset the search criteria to the original default values.
     */
    reset: function () {
        this.clear();
        this.set(this.defaults);
        if (this.initial_params) {
            this.set_initial(this.initial_params);
        }
    }
});

/**
 * Model to retrieve hits facets.
 */
StrikeFinder.HitsFacetsModel = Backbone.Model.extend({
    initialize: function () {
        this.params = {};
    },
    url: function () {
        var result = '/sf/api/hits/facets?facets=tagname,iocname,item_type,exp_key,md5sum,am_cert_hash,username';

        // Base filters.
        if (this.params.services) {
            result += '&services=' + this.params.services;
        }
        if (this.params.clusters) {
            result += '&clusters=' + this.params.clusters;
        }
        if (this.params.exp_key) {
            result += '&' + $.param({exp_key: this.params.exp_key});
        }
        if (this.params.usertoken) {
            result += '&' + $.param({usertoken: this.params.usertoken});
        }
        if (this.params.iocnamehash) {
            result += '&' + $.param({iocnamehash: this.params.iocnamehash});
        }
        if (this.params.ioc_uuid) {
            result += '&' + $.param({ioc_uuid: this.params.ioc_uuid});
        }
        if (this.params.suppression_id) {
            result += '&' + $.param({suppression_id: this.params.suppression_id});
        }

        // Facet filters.
        if (this.params.rowitem_uuid) {
            result += '&' + $.param({rowitem_uuid: this.params.rowitem_uuid});
        }
        if (this.params.tagname && this.params.tagname.length > 0) {
            result += '&' + $.param({tagname: this.params.tagname});
        }
        if (this.params.iocname && this.params.iocname.length > 0) {
            result += '&' + $.param({iocname: this.params.iocname});
        }
        if (this.params.item_type && this.params.item_type.length > 0) {
            result += '&' + $.param({item_type: this.params.item_type});
        }
        if (this.params.md5sum && this.params.md5sum.length > 0) {
            result += '&' + $.param({md5sum: this.params.md5sum});
        }
        if (this.params.am_cert_hash && this.params.am_cert_hash.length > 0) {
            result += '&' + $.param({am_cert_hash: this.params.am_cert_hash});
        }
        if (this.params.username && this.params.username.length > 0) {
            result += '&' + $.param({username: this.params.username});
        }

        if (this.params.identity_rollup) {
            result += '&' + $.param({identity_rollup: true});
        }
        return result;
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
        ioc_uuid: "",
        details: "",
        iocnamehash: "",
        uuid: 0
    }
});
StrikeFinder.IOCCollection = Backbone.Collection.extend({
    initialize: function (models, options) {
        if (options) {
            this.rowitem_uuid = options.rowitem_uuid;
        }
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/iocs', this.rowitem_uuid);
    },
    model: StrikeFinder.IOCModel
});

/**
 * Audit Details Model.
 */
StrikeFinder.AuditModel = Backbone.Model.extend({
    defaults: {
        html: ""
    },
    urlRoot: '/sf/api/audit'
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
        ioc_uuid: '',
        iocname: '',
        iocnamehash: ''
    },
    idAttribute: 'suppression_id',
    urlRoot: '/sf/api/suppressions',
    as_string: function () {
        return StrikeFinder.format_suppression(this.attributes);
    }
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
            return _.sprintf('/sf/api/suppressions?limit=0&exp_key=%s', this.exp_key);
        }
        else {
            return '/sf/api/suppressions?limit=0';
        }
    }
});

/**
 * Model for a single acquisisition.
 */
StrikeFinder.Acquisition = Backbone.Model.extend({
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
        return StrikeFinder.format_acquisition(this.attributes);
    }
});

/**
 * Collection class for acquisitions.
 */
StrikeFinder.AcquisitionCollection = Backbone.Collection.extend({
    model: StrikeFinder.Acquisition,
    url: function () {
        if (this.identity) {
            return _.sprintf('/sf/api/acquisitions/identity/%s', this.identity);
        }
        else {
            return '/sf/api/acquisitions';
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
        if (options && options.rowitem_uuid) {
            this.rowitem_uuid = options.rowitem_uuid;
        }
    },
    url: function () {
        return _.sprintf('/sf/api/hits/%s/comments?limit=0', this.rowitem_uuid);
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
    initialize: function (models, options) {
        if (options && options.searchable) {
            this.searchable = true;
        }
    },
    model: StrikeFinder.TagModel,
    url: '/sf/api/tags',
    parse: function (response, options) {
        if (this.searchable) {
            var results = [];
            _.each(response, function (tag) {
                if (tag.name != 'notreviewed') {
                    results.push(tag);
                }
            });
            return results;
        }
        else {
            return response;
        }
    },
    /**
     * Override the default fetch to local in sessionStorage before making the remote call.
     * @param options - the fetch options.
     * @returns {*}
     */
    fetch: function (options) {
        var tags = UAC.session('strikefinder:tags');
        if (tags) {
            this.reset(tags);
        }
        else {

        }
        //do specific pre-processing

        //Call Backbone's fetch
        return Backbone.Collection.prototype.fetch.call(this, options);
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

/**
 * Model for retrieving an acquisition audit.  Expects an acquisition_uuid to be supplied in the id field.
 */
StrikeFinder.AcquisitionAuditModel = Backbone.Model.extend({
    url: function () {
        return _.sprintf('/sf/api/acquisitions/%s/audit', this.id);
    }
});

StrikeFinder.Task = Backbone.Model.extend({
    urlRoot: '/sf/api/tasks',
    defaults: {
        description: '',
        ready: false,
        started: undefined,
        state: undefined,
        id: '',
        result: undefined
    }
});

StrikeFinder.TaskCollection = Backbone.Collection.extend({
    url: '/sf/api/tasks',
    model: StrikeFinder.Task
});

StrikeFinder.Identity = Backbone.Model.extend({
});

StrikeFinder.IdentitiesCollection = Backbone.Collection.extend({
    model: StrikeFinder.Identity
});

StrikeFinder.ClientModel = Backbone.Model.extend({
    idAttribute: 'client_uuid'
});
StrikeFinder.ClientCollection = Backbone.Collection.extend({
    url: '/sf/api/clients',
    model: StrikeFinder.ClientModel
});

/**
 * Model to retrieve whether cluster credentials exist.
 */
StrikeFinder.ClusterCredentialsModel = Backbone.Model.extend({
    idAttribute: 'cluster_uuid',
    urlRoot: '/sf/api/credentials/cluster',
    defaults: {
        found: false
    }
});