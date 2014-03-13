define (require) ->

    Backbone = require 'backbone'

    ###
        Extend the Backbone model class.
    ###
    class Model extends Backbone.Model