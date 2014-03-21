define (require) ->
    TableView = require 'uac/views/TableView'
    DataTableView = require 'uac/views/DataTableView'

    #
    # Alerts summary table view.
    #
    class AlertSummaryTableView extends DataTableView
        configure: (options, settings) ->
            settings.aoColumns = [
                {sTitle: 'Priority', mData: 'highest_priority'}
                {sTitle: 'Name, Type, Device(s)', mData: 'name'}
                {sTitle: 'Open', mData: 'tags.notreviewed'}
                {sTitle: 'In Prog', mData: 'tags.notreviewed'}
                {sTitle: 'First Seen', mData: 'first_seen'}
                {sTitle: 'Last Seen', mData: 'last_seen'}
            ]

            # TODO: Add cell renderers...

            settings.aaSorting = [
                [0, "asc"]
            ]

            settings.oLanguage = {
                sEmptyTable: 'No matching alerts were found.'
            }

            settings.iDisplayLength = 25;
            settings.sDom = 'lftip'
            return

    AlertSummaryTableView
