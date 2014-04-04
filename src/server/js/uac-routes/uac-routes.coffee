express = require 'express'
_ = require 'underscore.string'
log = require 'winston'

settings = require 'settings'
route_utils = require 'route-utils'
uac_api = require 'uac-api'
sf_api = require 'sf-api'


app = module.exports = express()


route_utils.load_views app

#
# Default UAC route.
#
app.get '/', (req, res) ->
    res.render '/uac/index.html', route_utils.default_context(req)

#
# UAC logout route.
#
app.get '/logout',  (req, res) ->
    if req.uid
        log.debug "Signing out user: #{route_utils.get_uid req}"
    if req.session && req.session.destroy
        req.session.destroy()
    req.session = undefined

    res.redirect settings.get settings.SSO_LOGOUT_URL ? '/'
    return

#
# MD5 lookup route.
#
app.get '/md5/:hash',  (req, res) ->
  hash = req.params.hash
  if not hash
    # Error, type is required.
    res.send 400, '"hash" is required.'

  else
    context = route_utils.default_context req
    context.hash = hash
    res.render '/uac/md5.html', context


#
# MD5 API lookup route.
#
app.get '/api/md5/:hash',  (req, res) ->
  hash = req.params.hash
  if not hash
    # Error, type is required.
    res.send 400, '"hash" is required.'

  else
    uac_api.get_md5_details hash, (err, result)->
      if err
        next err
      else
        route_utils.send res, result


#
# Retrieve the list of IOC terms by type.
#
app.get '/api/iocterms/:type', (req, res, next) ->
    type = req.params.type
    if not type
        # Error, type is required.
        res.send 400, '"type" is required.'
    else
        uac_api.get_ioc_terms type, (err, result) ->
            if err
                next err
            else
                res.send route_utils.stringify(result)
    return

