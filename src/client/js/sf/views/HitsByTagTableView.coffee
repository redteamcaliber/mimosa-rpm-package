define (require) ->

    Marionette = require 'marionette'
    TableView = require 'uac/views/TableView'
    renderers = require 'uac/views/renderers'

    class HitsByTagTableView extends TableView
        initialize: (options) ->
            super options

            options['aoColumns'] = [
                {sTitle: "uuid", mData: "uuid", bVisible: false, bSortable: false}
                {sTitle: "Updated", mData: "updated", sClass: 'nowrap', bSortable: true}
                {sTitle: "Cluster", mData: "cluster_name", bSortable: false}
                {sTitle: "Host", mData: "hostname", bSortable: false}
                {sTitle: "am_cert_hash", mData: "am_cert_hash", bVisible: false, bSortable: false}
                {sTitle: "Item Type", mData: "rowitem_type", bSortable: false, bVisible: false}
                {sTitle: "Tag", mData: "tagname", bVisible: false, bSortable: false}
                {sTitle: "Summary", mData: "summary1", sClass: 'wrap', bSortable: true}
                {sTitle: "Summary2", mData: "summary2", sClass: 'wrap', bSortable: true}
                {sTitle: "MD5", mData: "md5sum", bSortable: true, bVisible: true, sClass: 'nowrap'}
                {sTitle: "Owner", mData: "username", bSortable: false, bVisible: false}
            ]

            options.aaSorting = [
                [1, 'desc']
            ]

            options.aoColumnDefs = [
                renderers.date_time(1)
            ]

            options.oLanguage =
                sEmptyTable: 'No hits were found for the specified tag'

            options.sDom = 'l<"<sf-table-wrapper"t>ip'

            options.sAjaxSource = '/sf/api/hits'
            options.sAjaxDataProp = 'results'
            options.bServerSide = true