define (require) ->

    Marionette = require 'marionette'

    templates = require 'sf/ejs/templates'


    #
    # Layout for displaying the main hit review template.
    #
    class HitReviewLayout extends Marionette.Layout
        template: templates['hit-review-layout.ejs'],
        regions:
            hits_facets_region: '.hits-facets-region'
            hits_table_region: '.hits-table-region'
            hits_region: '.hits-region'
            hits_details_region: '.hits-details-region'