define(function (require) {
    var Backbone = require('backbone');
    var AgentTask = require('sf/models/AgentTask');
    var _ = require('underscore');

    /**
     * Collection class for acquisitions.
     */
    var AgentTaskCollection = Backbone.Collection.extend({
        model: AgentTask,
        url: function () {
            if (_.isString(this.identity) && this.dataSource !== "All Tasks") {
                return _.sprintf('/sf/api/acquisitions/identity/%s', this.identity);
            }
            else if (_.isString(this.host) && this.dataSource === "All Tasks") {
                return _.sprintf('/sf/api/task_result?agent__uuid=%s', this.host);
            }
            else if (_.isString(this.hash) && this.dataSource === "All Tasks") {
                return _.sprintf('/sf/api/task_result?agent__hash=%s', this.hash);
            }
            else {
                return '/sf/api/acquisitions';
            }
        },
        parse: function (response, options) {
            if(response.results){
                return response.results;
            }else{
                return response;
            }
        }
    });

    return AgentTaskCollection;
});