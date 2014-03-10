
###
    Tag model class.
###
class Alerts.TagModel extends Backbone.Model

###
    Tag collection class.
###
class Alerts.TagCollection extends Backbone.Collection
    model: Alerts.TagModel
    url: '/alerts/api/tags'