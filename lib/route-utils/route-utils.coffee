assert = require 'assert'
_ = require 'underscore'
_.str = require 'underscore.string'
_.mixin _.str.exports()

json2csv = require 'json2csv'

settings = require 'settings'
log = require 'winston'
nunjucks = require 'nunjucks'
aes = require 'aes'


###
  Utility method to load the application views.
  @param app - the application instance.
###
load_views = (app) ->
    nunjucks.configure('views',
        autoescape: true
        express: app
    )

###
  Map of themes.
###
THEMES =
    default:
        id: 'default'
        name: 'Default'
    default12:
        id: 'default12'
        name: 'Default12'
    amelia:
        id: 'amelia'
        name: 'Amelia'
    amelia12:
        id: 'amelia12'
        name: 'Amelia12'
    cerulean:
        id: 'cerulean'
        name: 'Cerulean'
    cerulean12:
        id: 'cerulean12'
        name: 'Cerulean12'
    cosmo:
        id: 'cosmo'
        name: 'Cosmo'
    cosmo13:
        id: 'cosmo13'
        name: 'Cosmo13'
    cupid:
        id: 'cupid'
        name: 'Cupid'
    cyborg:
        id: 'cyborg'
        name: 'Cyborg'
    cyborg12:
        id: 'cyborg12'
        name: 'Cyborg12'
    flatly:
        id: 'flatly'
        name: 'Flatly'
    flatly13:
        id: 'flatly13'
        name: 'Flatly13'
    journal:
        id: 'journal'
        name: 'Journal'
    journal13:
        id: 'journal13'
        name: 'Journal13'
    lumen:
        id: 'lumen'
        name: 'Lumen'
    simplex:
        id: 'simplex'
        name: 'Simplex'
    slate:
        id: 'slate'
        name: 'Slate'
    slate12:
        id: 'slate12'
        name: 'Slate12'
    spacelab:
        id: 'spacelab'
        name: 'Spacelab'
    spacelab12:
        id: 'spacelab12'
        name: 'Spacelab12'
    superhero:
        id: 'superhero'
        name: 'Superhero'
    united:
        id: 'united'
        name: 'United'
    united12:
        id: 'united12'
        name: 'United12'
    yeti:
        id: 'yeti'
        name: 'Yeti'


###
  Extract the users uid from the request.
  @param req - the request.
  @returns {String} - The users uid or undefined.
###
get_uid = (req) ->
    if req && req.attributes && req.attributes.uid
        return req.attributes.uid
    else if req && req.session && req.session.sso && req.session.sso.uid
        return req.session.sso.uid
    else
        return null


###
  Return the default context data to be passed to the views.
  @param req - the application request.
  @returns {{req: *, config: *}}
###
default_context = (req) ->
    assert(req)
    assert(req.session)

    context =
        uid: get_uid(req)
        csrf_token: req.csrfToken()
        settings: settings.get()
        node_env: process.env.NODE_ENV

    cookie_theme = req.cookies.theme

    context.themes = _.values(THEMES)

    if _.keys(THEMES).indexOf(cookie_theme) != -1
        # Theme is valid.
        context.current_theme = cookie_theme
    else
        context.current_theme = 'flatly'

    context

###
  Retrieve acquisition credentials from the session.
  @param req - the request.
  @param cluster_uuid - the cluster.
###
get_acquisition_credentials = (req, cluster_uuid) ->
    credential_map = req.session['acquisition_credentials']
    if  credential_map && credential_map[cluster_uuid]
        credentials = credential_map[cluster_uuid]
        key = settings.get('uac:encryption_secret')
        return (
            cluster_uuid: credentials.cluster_uuid
            user: aes.decrypt(key, credentials.user)
            password: aes.decrypt(key, credentials.password)
        )
    else
        # Not found.
        undefined;


###
  Add the acquisition credentials to the session.
  @param req - the request.
  @param cluster_uuid - the cluster.
  @param user - the username.
  @param password - the password.
###
add_acquisition_credentials = (req, cluster_uuid, user, password) ->
    credential_map = req.session['acquisition_credentials'] || {}
    key = settings.get 'uac:encryption_secret'
    credential_map[cluster_uuid] =
        user: aes.encrypt(key, user)
        cluster_uuid: cluster_uuid
        password: aes.encrypt key, password
    req.session['acquisition_credentials'] = credential_map

###
  Render a template catching any errors that may occur.
  @param res - the response.
  @param template - the template path.
  @param context - the template context.
  @param next - the next instance.
###
render_template = (res, template, context, next) ->
    try
        res.render template, context
    catch e
    # Error
        next e

send404 = (req, res, next) ->
    context = default_context req
    context.original_url = req.originalUrl
    render_template(res, '/uac/404.html', context, next)

send400 = (req, res, next, error) ->
    context = default_context req
    context.original_url = req.originalUrl
    if error
        context.error = error
    render_template res, '/uac/400.html', context, next

send500 = (req, res, next, error) ->
    context = default_context(req)
    context.original_url = req.originalUrl
    if error
        context.error = error
    render_template(res, '/uac/500.html', context, next)


###
  Return the object as JSON.
###
stringify = (o) ->
    JSON.stringify o, null, 4


###
 If there is not an error then send the JSON stringified version of the object to the response.
 @param res - the response.
 @param o - the object to send.
 @returns {*}
###
send = (res, o) ->
    res.send stringify o
    return

###
  Send a CSV file.
  @param res - the response.
  @param next - next function.
  @param o - the JSON data.
###
send_csv = (res, next, o, fields) ->
    json2csv
        data: o
        fields: fields, (err, csv) ->
            if err then next err else res.send csv

get_dt_request_params = (req) ->
    params = {}
    if req.query.iDisplayLength isnt undefined
        params.limit = req.query.iDisplayLength
    else if req.query.format == 'csv'
        # When exporting to a CSV file return all rows.
        params.limit = 0
    else if !req.query.limit isnt undefined
        # If a limit was not supplied then assume all rows are returned.
        params.limit = 0
    if req.query.iDisplayStart isnt undefined
        params.offset = req.query.iDisplayStart

    #
    # Sorting
    if req.query.iSortingCols && req.query.iSortingCols > 0
        # A sort column is specified.
        if req.query['iSortCol_0']
            sort_index = req.query['iSortCol_0']
            sort_name = _.sprintf 'mDataProp_%s', sort_index
            if req.query[sort_name]
                # Add the sort column to the params.
                params.sort = req.query[sort_name]

                if req.query['sSortDir_0']
                    # Add the order to the params.
                    params.order = req.query['sSortDir_0']
    params


get_dt_response_params = (results, count, offset, echo) ->
    results: results
    iTotalDisplayRecords: count
    iTotalRecords: count
    iDisplayStart: offset
    sEcho: echo


###
  Validate that all the properties specified are found in the list of values.  If validation fails send a HTTP 400
  response and return false.
  @param props - an array of property strings.
  @param values - the dictionary of values.
  @param res - the response.
  @returns {{ok: boolean, message: string}}
###
validate_input = (props, values, res) ->
    ok = true

    if Array.isArray props
        # List of properties.
        props.forEach (prop) ->
            if !_.has(values, prop)
                ok = false;
                if missing_props
                    missing_props += ', ' + prop
                else
                    missing_props = prop;
    else
        # Single property.
        ok = _.has values, props

    if not ok
        # Send an invalid request response.
        res.send 400, "The following properties are required: #{missing_props}"
    ok

###
  Return whether the request is considered from a browser.
###
is_html_request = (req) ->
    req.accepted && req.accepted.length > 0 && req.accepts('html') && !req.xhr

###
  Return whether the parameter is in the format of a UUID.
###
is_uuid = (uuid) ->
    uuid && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(uuid)


exports.get_uid = get_uid
exports.default_context = default_context
exports.add_acquisition_credentials = add_acquisition_credentials
exports.get_acquisition_credentials = get_acquisition_credentials
exports.render_template = render_template
exports.load_views = load_views
exports.stringify = stringify
exports.send = send
exports.send_csv = send_csv
exports.get_dt_request_params = get_dt_request_params
exports.get_dt_response_params = get_dt_response_params
exports.validate_input = validate_input
exports.is_html_request = is_html_request
exports.is_uuid = is_uuid

exports.send404 = send404
exports.send400 = send400
exports.send500 = send500