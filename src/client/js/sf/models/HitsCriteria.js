define(function(require) {
    var Backbone = require('backbone');

    /**
     * Generic model to store hits criteria.  This model currently transient and does not connect to the server.
     */
    var HitsCriteria = Backbone.Model.extend({
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

    return HitsCriteria;
});
