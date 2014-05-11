define (require)->
    resources = require 'uac/common/resources'

    SelectView = require 'uac/views/SelectView'
    TimeSearchView = require 'uac/views/TimeSearchView'
    moment = require 'moment'
    utils = require 'uac/common/utils'
    templates = require 'sf/ejs/templates'
    StrikeFinderEvents = require 'sf/common/StrikeFinderEvents'
    ServicesCollection = require 'sf/models/ServicesCollection'
    ClientCollection = require 'sf/models/ClientCollection'
    ClustersCollection = require 'sf/models/ClustersCollection'
    Marionette = require 'marionette'
    vent = require 'uac/common/vent'
    reqres = require 'uac/common/reqres'
    async = require 'async'


    #
    # Generic view for displaying clients, clusters, and date range.
    #
    class ClusterSelectionView extends Marionette.Layout
        template: templates['cluster-selection.ejs']

        regions:
            clear_button_region: '#clear-button'
            clients_select_region: '#clients-select-region'
            search_controls_region: '#searchControls'
            services_select_region: '#services-select-region'
            clusters_select_region: '#clusters-select-region'
            submit_button_region: '#submit-button'

        serializeData: =>
            hide_services: @options.hide_services

        #
        # Render the selection view.
        #
        onRender: ->
            display_services = @options.hide_services isnt true

            usersettings = utils.usersettings()
            if @options.hide_timeframe != true
                if usersettings.timeFrame
                    console.debug "Found existing alerts search selections: #{JSON.stringify(usersettings.timeFrame)}"

                time = if usersettings.timeFrame and usersettings.timeFrame.time then usersettings.timeFrame.time else undefined
                if time == 'custom'
                    # A custom time was specified, try and get the last save from and to date/times.
                    from = if usersettings.timeFrame and usersettings.timeFrame.from then usersettings.timeFrame.from else undefined
                    to = if usersettings.timeFrame and usersettings.timeFrame.to then usersettings.timeFrame.to else undefined

                @times = new Backbone.Collection(resources.sf_times)
                @timeSearchView = new TimeSearchView
                    selected: time
                    from: from
                    to: to
                    default: 'days_1'
                    collection: @times
                @search_controls_region.show @timeSearchView


            if display_services
                # Render the services.
                @services = new ServicesCollection()
                @services_view = new SelectView
                    collection: @services
                    id_field: "mcirt_service_name"
                    value_field: "description"
                    selected: usersettings.services
                    multiple: true
                    select_options:
                        width: "100%"
                @services.reset StrikeFinder.services
                @services_select_region.show @services_view

            # Render the clients.
            @clients = new ClientCollection()
            @clients_view = new SelectView
                collection: @clients
                id_field: 'client_uuid'
                value_field: 'client_name'
                selected: usersettings.clients
                select_options:
                    width: '100%'
                multiple: true
                placeholder: 'Select Clients'
            @clients.reset(StrikeFinder.clients)

            @clients_select_region.show @clients_view

            # Render the clusters.
            @clusters = new ClustersCollection()
            @clusters_view = new SelectView
                collection: @clusters
                id_field: "cluster_uuid"
                value_field: "cluster_name"
                selected: usersettings.clusters
                multiple: true
                select_options:
                    width: "100%"
            # Load the initial clusters options based on the clients.
            @load_clusters()
            @clusters_select_region.show @clusters_view

            #Register event handlers.
            @delegateEvents
                'click #submit-button': 'on_submit'
                'click #clear-button': 'on_clear'

            vent.on "DateView:startDate:change", =>
                @update_options()
            vent.on "DateView:endDate:change", =>
                @update_options()

            @update_options()

            # Update the buttons when items are changed.
            if display_services
                @services_view.on 'change', =>
                    # Update the submit button.
                    @update_options()
            @clients_view.on 'change', =>
                # Reload the clusters based on the selected clients.
                @load_clusters()

                #Update the submit button.
                @update_options()
            @clusters_view.on 'change', =>
                #Update the submit button.
                @update_options()

            return @

        #
        #  Load the clusters options based on the current clients selection.  Don't load any clusters that correspond to
        #  a client that is currently selected.
        #
        load_clusters: ->
            clusters = []

            #Create a map of the selected client ids.
            clients = @get_selected_clients()
            client_map = {}
            clients.forEach (client_uuid)->
                client_map[client_uuid] = client_uuid


            #Obtain the list of available clusters.
            StrikeFinder.clusters.forEach (cluster)->
                unless cluster.client_uuid in client_map then clusters.push(cluster)

            @clusters.reset(clusters)


        #
        # Retrieve the set of clusters based on both the clients and clusters selections.
        #
        get_clusters: ->
            clients = @get_selected_clients()
            clusters = @get_selected_clusters()

            ###
              Consolidate the clusters parameters.  Use the clusters corresponding to all selected clients as well as
              any individually selected clusters.
            ###
            clusters_map = {}
            clients.forEach (client_uuid)->
                StrikeFinder.clusters.forEach (cluster)->
                    if(cluster.client_uuid == client_uuid && (!(cluster.cluster_uuid in clusters_map)))
                        clusters_map[cluster.cluster_uuid] = cluster.cluster_uuid

            clusters.forEach (cluster_uuid)->
                unless cluster_uuid in clusters_map then clusters_map[cluster_uuid] = cluster_uuid

            return _.keys(clusters_map)

        #
        # Get the selected services.
        #
        get_selected_services: -> if @options.hide_services == true then [] else @services_view.get_selected()

        #
        # Get the selected clients.
        #
        get_selected_clients: ->
            @clients_view.get_selected()

        #
        # Get the selected clusters, not consolidated.
        #
        get_selected_clusters: ->
            @clusters_view.get_selected()

        #
        # Get the start date to filter down results
        #
        get_start_date: ->
            reqres.request "DateView:startDate:getEpoch"

        #
        # Get the end date to filter down results
        #
        get_end_date: ->
            reqres.request "DateView:endDate:getEpoch"

        #
        # Get the time frame
        #
        get_time_frame: -> if @options.hide_timeframe == true then null else @timeSearchView.get_selected()

        #
        # Call this method to enable or disable the submit button.
        # @param enabled - true or false, defaults to true.
        #
        enable_submit: (enabled)->
            @$el.find(@submit_button_region.el).prop('disabled', enabled == false)


        #
        # Call this method to enable or disable the clear button.
        #  @param enabled - true or false, defaults to false.
        #
        enable_clear: (enabled)->
            @$el.find(@clear_button_region.el).prop('disabled', enabled == false)

        #
        # Update the submit button status based on the current form selections.  The button should only be enabled if a
        # service is selected and a client or clusters is selected.
        #
        update_options: ->
            if @options.hide_services
                submit_enabled = @get_selected_clients().length > 0 || @get_selected_clusters().length > 0
                submit_enabled = submit_enabled && !_.isNull(@get_start_date()) && !_.isNull(@get_end_date())

            else
                submit_enabled = @get_selected_services().length > 0 && (@get_selected_clients().length > 0 || @get_selected_clusters().length > 0)
                submit_enabled = submit_enabled && !_.isNull(@get_start_date()) && !_.isNull(@get_end_date())

            @enable_submit(submit_enabled)
            @enable_clear(submit_enabled)


        #
        # Handle the search submit request.
        #
        on_submit: ->
            usersettings = utils.usersettings()
            utils.usersettings
                services: usersettings.services,
                clients: usersettings.clients,
                clusters: usersettings.clusters,
                timeFrame:
                    from: new Date(@get_start_date() * 1000)
                    to: new Date(@get_end_date() * 1000)
                    time: @get_time_frame()


            # Trigger and event with the current services and merged clusters selections.

            event =
                services: @get_selected_services()
                clients: @get_selected_clients()
                clusters: @get_selected_clusters()
                merged_clusters: @get_clusters()
                startDate: @get_start_date()
                endDate: @get_end_date()
            @trigger 'submit', event
            vent.trigger StrikeFinderEvents.SF_IOC_SEARCH, event



        #
        # Handle the clear button click.
        #
        on_clear: ->
            if @options.hide_services != true then @services_view.clear()

            @clients_view.clear()
            @clusters_view.clear()
            @timeSearchView.reset_selected()
            @trigger('clear')
            vent.trigger StrikeFinderEvents.SF_IOC_RESET


    return ClusterSelectionView
