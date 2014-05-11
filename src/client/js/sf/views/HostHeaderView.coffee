define (require) ->

    Marionette = require 'marionette'

    templates = require 'sf/ejs/templates'


    #
    # StrikeFinder view class for displaying a hosts extended details.
    #
    class HostHeaderView extends Marionette.ItemView
        template: templates['host.ejs']

    HostHeaderView