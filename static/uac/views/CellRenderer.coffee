define (require) ->
    moment = require 'moment'


    #
    # Format a date with an optional mask.  Default format is YYYY-MM-DD HH:mm:ss.
    #
    format_date = (d, mask) ->
        m = moment d
        if m.isValid()
            if mask
                m.format mask
            else
                m.format 'YYYY-MM-DD HH:mm:ss'
        else
            return d

    #
    # Format the date into the following date/time format: YYYY-MM-DD HH:mm:ss.
    #
    date_time_renderer = (index) ->
        mRender: (data) ->
            format_date data
        aTargets: [index]

    date_time_multiline_renderer = (index) ->
        mRender: (data) ->
            format_date data, ' YYYY-MM-DD<br/> HH:mm:ss'
        aTargets: [index]


    date_time: date_time_renderer
    date_time_multiline: date_time_multiline_renderer