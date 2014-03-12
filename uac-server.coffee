os = require 'os'
fs = require 'fs'
cluster = require 'cluster'
https = require 'https'
http = require 'http'
express = require 'express'

log = require 'winston'

# UAC requirements.
settings = require 'settings'
sso = require 'sso'
route_utils = require 'route-utils'
uac_routes = require 'uac-routes'
alerts_routes = require 'alerts-routes'
sf_routes = require 'sf-routes'
nt_routes = require 'nt-routes'
test_routes = require 'test-routes'

#
# Initialize the application middleware.
#
app = express()


# Redis session store.
RedisStore = require('connect-redis')(express)


#
# Setup console logging.
#
log.remove log.transports.Console
log.add log.transports.Console, {
    level: settings.get('server:log_level'),
    colorize: true
}

# Set up file logging.
log.add log.transports.File, {
    level: settings.get('server:log_level'),
    colorize: true,
    filename: settings.get('server:log_file'),
    json: false,
    timestamp: true,
    maxsize: settings.get('server:log_maxsize'),
    maxfiles: settings.get('server:log_maxfiles')
}

# Enable the proxy support.
app.enable 'trust proxy'
console.log 'trust proxy enabled: ' + app.get('trust proxy')


app.use express.compress()

app.use express.favicon(__dirname + '/static/img/mandiant.ico')
app.use '/static', express.static('static')

app.use express.cookieParser()

app.use express.session {
    key: 'uac.sess',
    secret: settings.get('server:session_secret'),
    proxy: true,
    cookie: { path: '/', httpOnly: true, secure: true },
    store: new RedisStore {
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        ttl: 86400
    }
}

app.use express.query()
app.use express.bodyParser()

app.use sso.require_authentication(settings.get('sso'))

app.use express.csrf()

app.use app.router

app.use uac_routes
app.use '/alerts', alerts_routes
app.use '/sf', sf_routes
app.use '/nt', nt_routes

app.configure 'dev', ->
    # Load development routes.
    console.log 'Loading dev routes...'
    app.use '/test', test_routes

route_utils.load_views app

# Add a 404 handler.
app.use (req, res, next) ->
    try
        uid = route_utils.get_uid(req)
        log.error "404::User: #{uid} requested non-existent page: #{req.originalUrl}."

        if route_utils.is_html_request(req)
            route_utils.send404(req, res, next)
        else
            # Send a 404 response to AJAX clients.
            res.send 404, req.originalUrl + ' is not available.'
    catch e
        # Error.
        log.error 'Error rendering 404 page.'
        next(e)

# Add a general error handler.
app.use (err, req, res, next) ->
    uid = route_utils.get_uid(req)

    stack = undefined
    if err and err.stack
        stack = err.stack
    else if err
        stack = err
    else
        stack = req.body

    # Log the error message and stack trace.
    log.error "Global error handler caught exception while rendering #{req.method} url: #{req.originalUrl} (status: #{res.statusCode}, uid: #{uid}) \n#{stack}"

    if route_utils.is_html_request(req)
        # Display the formatted 500 page.
        route_utils.send500 req, res, next, stack
    else
        # Send a 500 response to AJAX clients.
        res.send 500, "Exception invoking url: #{req.originalUrl} - #{stack}"

###
    Create a server instance using the global settings.
###
create_server = ->
    console.log "server:port=#{settings.get 'server:port'}"
    console.log "server:ssl=#{settings.get 'server:ssl'}"

    host = settings.get 'server:host'
    if not host
        host = 'localhost'

    if settings.get('server:ssl') is true
        https.createServer({
            key: fs.readFileSync(settings.get 'server:ssl_key'),
            cert: fs.readFileSync(settings.get 'server:ssl_cert')
        }, app).listen(settings.get 'server:port', host)
    else
        http.createServer(app).listen(settings.get('server:port'), host)

    console.log 'Creating worker server...'

###
    Shut down the UAC application server.
###
shutdown = ->
    if cluster.isMaster
        console.log 'Shutting down cluster master...'
    else
        console.log 'Shutting down server worker...'
    process.exit()

process.on 'SIGINT', shutdown
process.on 'SIGTERM', shutdown
process.on 'uncaughtException', (err) ->
    # Log any error that crashes the server with the keyword = FATAL.
    log.error 'FATAL: Encountered an unhandled server exception.'
    if  err && err.stack
        log.error err.stack
    else if err
        log.error err

    # Shut down the server.
    shutdown()

# Start the server.
workers = settings.get 'server:workers'
cpus = os.cpus().length

# Ensure that the numbers of workers is defined.
if not workers
    console.log 'WARNING: "server:workers" property is not defined, defaulting to 1'
    workers = 1

# Display a warning if the number of workers is greater that the CPU count.
if  workers > cpus
    console.log "WARNING: \"server:workers\" property is greater than the hardware CPU count (#{workers} > #{cpus})"

if workers > 1
    # Cluster mode is enabled.
    if cluster.isMaster
        # Configuration for the master node.
        console.log "Cluster mode is ACTIVE, starting #{workers} workers..."
        console.log "Hardware has #{cpus} cores available..."

        cluster.on 'listening', (worker, address) ->
        console.log "Worker (#{worker.id}) listening on address: #{address.address}:#{address.port}"

        cluster.on 'exit', (worker, code) ->
            # Worker is exiting.
            console.log "Server worker (#{worker.id}) exiting with code: #{code}..."
            cluster.fork()

        for worker in workers
            # Fork a worker
            console.log "Forking server worker: #{worker.id}..."
            cluster.fork()
    else
        # Start the worker server.
        create_server()
else
    # Start a single server.
    console.log 'Cluster mode is INACTIVE...'
    create_server()
