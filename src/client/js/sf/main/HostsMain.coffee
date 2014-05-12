define (require) ->

    _  = require 'underscore'
    _s = require 'underscore.string'
    _.mixin(_s.exports())

    Marionette = require 'marionette'

    CollapsableView = require 'uac/views/CollapsableView'
    FetchController = require 'uac/controllers/FetchController'

    HostHeaderView = require 'sf/views/HostHeaderView'
    AgentTasksTableView = require 'sf/views/AgentTasksTableView'
    AgentHostModel = require 'sf/models/AgentHostModel'
    HitsView = require 'sf/views/HitsView'


    HostsApp = new Marionette.Application()

    HostsApp.addRegions
        host_header_region: '#host-header-region'
        agent_tasks_region: '#agent-tasks-region'
        hits_region: '#hits-region'

    HostsApp.addInitializer ->
        # The host.
        host = new AgentHostModel(StrikeFinder.host)

        client = StrikeFinder.host.cluster.engagement.client.name
        cluster = StrikeFinder.host.cluster.name
        domain = StrikeFinder.host.domain
        hostname = StrikeFinder.host.hostname

        # The host collapsable.
        host_collapsable = new CollapsableView
            title: "<i class=\"fa fa-desktop\"></i> #{client} (#{cluster}) : #{domain} / #{hostname}"

        # The host header view.
        hosts_view = new HostHeaderView
            model: host

        # Display the host header.
        controller = new FetchController
            model: host
            view: host_collapsable
            region: @host_header_region
        controller.fetch
            success: ->
                host_collapsable.show hosts_view

        # Display the tasks related to the host.
        tasks_collapsable = new CollapsableView
            collapsed: true
        @agent_tasks_region.show tasks_collapsable
        tasks_view = new AgentTasksTableView
            server_data:
                agent__uuid: StrikeFinder.host.uuid
        tasks_view.listenToOnce tasks_view, 'load', =>
            tasks_count = tasks_view.get_total_rows()
            tasks_collapsable.set_title "<i class=\"fa fa-tasks\"></i> Agent Tasks (#{tasks_count})"
            if tasks_count > 0
                tasks_collapsable.expand()
        tasks_collapsable.show tasks_view

        # Display the hits related to the host.
        hits_view = new HitsView
            identity_rollup: true
        @hits_region.show hits_view
        hits_view.fetch
            identity_rollup: true
            am_cert_hash: StrikeFinder.host.hash

    HostsApp.start()

