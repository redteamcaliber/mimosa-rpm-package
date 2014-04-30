define(function(require) {
    var Backbone = require('backbone');

    /**
     * Model to retrieve hits facets.
     */
    var HitsFacetsModel = Backbone.Model.extend({
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
            if (this.params.begin) {
                result += '&' + $.param({begin: this.params.begin});
            }
            if (this.params.end) {
                result += '&' + $.param({end: this.params.end});
            }

            // Facet filters.
            if (this.params.rowitem_uuid) {
                result += '&' + $.param({rowitem_uuid: this.params.rowitem_uuid});
            }
            if (this.params.identity) {
                result += '&' + $.param({identity: this.params.identity});
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

    return HitsFacetsModel;
});