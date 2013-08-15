/*
 * DataTables Add-Ons - http://www.datatables.net/plug-ins/api
 */

/* API method to get paging information */
$.fn.dataTableExt.oApi.fnPagingInfo = function (oSettings) {
    return {
        "iStart": oSettings._iDisplayStart,
        "iEnd": oSettings.fnDisplayEnd(),
        "iLength": oSettings._iDisplayLength,
        "iTotal": oSettings.fnRecordsTotal(),
        "iFilteredTotal": oSettings.fnRecordsDisplay(),
        "iPage": oSettings._iDisplayLength === -1 ?
            0 : Math.ceil(oSettings._iDisplayStart / oSettings._iDisplayLength),
        "iTotalPages": oSettings._iDisplayLength === -1 ?
            0 : Math.ceil(oSettings.fnRecordsDisplay() / oSettings._iDisplayLength)
    };
};

/* Bootstrap style pagination control */
$.extend($.fn.dataTableExt.oPagination, {
    "bootstrap": {
        "fnInit": function (oSettings, nPaging, fnDraw) {
            var oLang = oSettings.oLanguage.oPaginate;
            var fnClickHandler = function (e) {
                e.preventDefault();
                if (oSettings.oApi._fnPageChange(oSettings, e.data.action)) {
                    fnDraw(oSettings);
                }
            };

            $(nPaging).addClass('pagination').append(
                '<ul>' +
                    '<li class="prev disabled"><a href="#">&larr; ' + oLang.sPrevious + '</a></li>' +
                    '<li class="next disabled"><a href="#">' + oLang.sNext + ' &rarr; </a></li>' +
                    '</ul>'
            );
            var els = $('a', nPaging);
            $(els[0]).bind('click.DT', { action: "previous" }, fnClickHandler);
            $(els[1]).bind('click.DT', { action: "next" }, fnClickHandler);
        },

        "fnUpdate": function (oSettings, fnDraw) {
            var iListLength = 5;
            var oPaging = oSettings.oInstance.fnPagingInfo();
            var an = oSettings.aanFeatures.p;
            var i, j, sClass, iStart, iEnd, iHalf = Math.floor(iListLength / 2);

            if (oPaging.iTotalPages < iListLength) {
                iStart = 1;
                iEnd = oPaging.iTotalPages;
            }
            else if (oPaging.iPage <= iHalf) {
                iStart = 1;
                iEnd = iListLength;
            } else if (oPaging.iPage >= (oPaging.iTotalPages - iHalf)) {
                iStart = oPaging.iTotalPages - iListLength + 1;
                iEnd = oPaging.iTotalPages;
            } else {
                iStart = oPaging.iPage - iHalf + 1;
                iEnd = iStart + iListLength - 1;
            }

            for (i = 0, iLen = an.length; i < iLen; i++) {
                // Remove the middle elements
                $('li:gt(0)', an[i]).filter(':not(:last)').remove();

                // Add the new list items and their event handlers
                for (j = iStart; j <= iEnd; j++) {
                    sClass = (j == oPaging.iPage + 1) ? 'class="active"' : '';
                    $('<li ' + sClass + '><a href="#">' + j + '</a></li>')
                        .insertBefore($('li:last', an[i])[0])
                        .bind('click', function (e) {
                            e.preventDefault();
                            oSettings._iDisplayStart = (parseInt($('a', this).text(), 10) - 1) * oPaging.iLength;
                            fnDraw(oSettings);
                        });
                }

                // Add / remove disabled classes from the static elements
                if (oPaging.iPage === 0) {
                    $('li:first', an[i]).addClass('disabled');
                } else {
                    $('li:first', an[i]).removeClass('disabled');
                }

                if (oPaging.iPage === oPaging.iTotalPages - 1 || oPaging.iTotalPages === 0) {
                    $('li:last', an[i]).addClass('disabled');
                } else {
                    $('li:last', an[i]).removeClass('disabled');
                }
            }
        }
    }
});

/**
 * Redraw the table (i.e. fnDraw) to take account of sorting and filtering, but retain the current pagination settings.
 * @param oSettings
 */
$.fn.dataTableExt.oApi.fnStandingRedraw = function (oSettings, fnCallback) {
    if (oSettings.oFeatures.bServerSide === false) {
        var before = oSettings._iDisplayStart;

        oSettings.oApi._fnReDraw(oSettings);

        // iDisplayStart has been reset to zero - so lets change it back
        oSettings._iDisplayStart = before;
        oSettings.oApi._fnCalculateEnd(oSettings);
    }

    // draw the 'current' page
    oSettings.oApi._fnDraw(oSettings);

    /* Callback user function - for event handlers etc */
    if (typeof fnCallback == 'function' && fnCallback !== null) {
        fnCallback(oSettings);
    }
};

/**
 * By default DataTables only uses the sAjaxSource variable at initialisation time, however it can be useful to re-read
 * an Ajax source and have the table update. Typically you would need to use the fnClearTable() and fnAddData()
 * functions, however this wraps it all up in a single function call.
 */
$.fn.dataTableExt.oApi.fnReloadAjax = function ( oSettings, sNewSource, fnCallback, bStandingRedraw )
{
    if ( sNewSource !== undefined && sNewSource !== null ) {
        oSettings.sAjaxSource = sNewSource;
    }

    // Server-side processing should just call fnDraw
    if ( oSettings.oFeatures.bServerSide ) {
        this.fnDraw();
        return;
    }

    this.oApi._fnProcessingDisplay( oSettings, true );
    var that = this;
    var iStart = oSettings._iDisplayStart;
    var aData = [];

    this.oApi._fnServerParams( oSettings, aData );

    oSettings.fnServerData.call( oSettings.oInstance, oSettings.sAjaxSource, aData, function(json) {
        /* Clear the old information from the table */
        that.oApi._fnClearTable( oSettings );

        /* Got the data - add it to the table */
        var aData =  (oSettings.sAjaxDataProp !== "") ?
            that.oApi._fnGetObjectDataFn( oSettings.sAjaxDataProp )( json ) : json;

        for ( var i=0 ; i<aData.length ; i++ )
        {
            that.oApi._fnAddData( oSettings, aData[i] );
        }

        oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

        that.fnDraw();

        if ( bStandingRedraw === true )
        {
            oSettings._iDisplayStart = iStart;
            that.oApi._fnCalculateEnd( oSettings );
            that.fnDraw( false );
        }

        that.oApi._fnProcessingDisplay( oSettings, false );

        /* Callback user function - for event handlers etc */
        if ( typeof fnCallback == 'function' && fnCallback !== null )
        {
            fnCallback( oSettings );
        }
    }, oSettings );
};

/**
 * Collection of DataTables utilities.
 */
DataTableUtils = {};

/**
 * Function for generating a column of static number in the table.
 * @param oSettings - the settings.
 */
DataTableUtils.generateStaticCounter = function (oSettings) {
    /* Need to redo the counters if filtered or sorted */
    //if (oSettings.bSorted || oSettings.bFiltered) {
    for (var i = 0, iLen = oSettings.aiDisplay.length; i < iLen; i++) {
        $('td:eq(0)', oSettings.aoData[ oSettings.aiDisplay[i] ].nTr).html(i + 1);
    }
};

/**
 * Method to obtain the default table values.
 * @returns {*}
 */
DataTableUtils.getDefaults = function (staticPath) {
    return {
        iDisplayLength: 100,
        sPaginationType: "bootstrap",
        aLengthMenu: [
            [10, 25, 50, 100, 1000],
            [10, 25, 50, 100, 1000]
        ],
        bProcessing: true,
        bServerSide: true,
        sDom: '<"datatables_top" lfr>t<"datatables_bottom" ip>'
//        ,oTableTools: {
//            // TODO: Need to rewrite this url.
//            "sSwfPath": staticPath + "datatables/extras/TableTools/media/swf/copy_csv_xls_pdf.swf"
//        }
//        ,fnDrawCallback: DataTableUtils.generateStaticCounter
    }
};

/**
 * Construct a datatable setting up the project default configuration.
 * @param div - the div to draw the table to.
 * @param settings - the custom settings.
 * @param staticPath - the URL to static resources.
 */
DataTableUtils.constructWithDefaults = function (div, settings, staticPath) {
    table = $(div).dataTable($.extend(true, DataTableUtils.getDefaults(staticPath), settings));
};

//
// Not used.
//

DataTableUtils.djangoFnServerData = function (sSource, aoData, fnCallback) {
    // Translate the default field values to those understood by datatables.
    $.getJSON(sSource, aoData, function (json) {
        json["iTotalRecords"] = json.count;
        json["iTotalDisplayRecords"] = json.count; // TODO: Fill this in?
        json["count"] = null;
        json["aaData"] = json.results;
        json["results"] = null;
        console.log(json);
        fnCallback(json);
    });
};

DataTableUtils.djangoFnServerParams = function (aoData) {
    for (var i in aoData) {
        var param = aoData[i];
        if (param['name'] == "sSearch") {
            aoData.push({name: "search", value: param['value']});
            break;
        }
    }
    aoData.push({name: "limit", value: this.fnSettings()._iDisplayLength});
    aoData.push({name: "offset", value: this.fnSettings()._iDisplayStart})
};

DataTableUtils.tastyPieFnServerData = function (sSource, aoData, fnCallback) {
    // Translate the default field values to those understood by datatables.
    $.getJSON(sSource, aoData, function (json) {
        json['iTotalRecords'] = json.meta.total_count;
        json['iTotalDisplayRecords'] = json.meta.total_count; // TODO: Fill this in?
        fnCallback(json);
    });
};

DataTableUtils.tastyPieFnServerParams = function (aoData) {
    for (var i in aoData) {
        var param = aoData[i];
        if (param['name'] == "sSearch") {
            aoData.push({name: "search", value: param['value']});
            break;
        }
    }
    aoData.push({name: "limit", value: this.fnSettings()._iDisplayLength});
    aoData.push({name: "offset", value: this.fnSettings()._iDisplayStart})
};