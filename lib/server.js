const path = require('path')
const express = require('express')
const Raven = require('raven')

// Express middleware
const session = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
// const favicon = require('serve-favicon')
const compression = require('compression')

const {
  ENV,
  PORT,
  USERNAME,
  PASSWORD,
  REALM,
  ASSET_PATH,
  ASSET_SRC_PATH,
  SENTRY_DSN,
  GA_TRACKING_ID
} = require('./constants')

const logger = require('./logger')
const auth = require('./middleware/auth')

const ping = require('./middleware/ping')
const healthcheck = require('./middleware/healthcheck')
const robots = require('./middleware/robots')
const locals = require('./middleware/locals')
const routesStatic = require('./middleware/routes-static')
const routesCached = require('./middleware/routes-cached')
const routesNunjucks = require('./middleware/routes-nunjucks')
const errorHandler = require('./middleware/error-handler')({GA_TRACKING_ID})

const nunjucksConfigure = require('./nunjucks-configure')

const start = (options = {}) => {
  const appDir = process.cwd()
  const kitLibDir = __dirname
  const kitDir = path.resolve(kitLibDir, '..')
  const cacheDir = path.join(appDir, ASSET_PATH, 'html')

  // const routesMetadata = require('./routes-metadata.js')

  const app = express()

  const sentryDSN = SENTRY_DSN
  if (sentryDSN) {
    Raven.config(sentryDSN).install()
    app.use(Raven.requestHandler())
  }

  app.disable('x-powered-by')

  // Set views engine
  app.set('view engine', 'html')

  // Configure nunjucks
  const nunjucksOptions = options.nunjucks || ENV ? {} : {
    noCache: true,
    watch: true
  }
  const nunjucksAppEnv = nunjucksConfigure(app, appDir, kitDir, nunjucksOptions)
  app.use((req, res, next) => {
    res.locals.nunjucksAppEnv = nunjucksAppEnv
    res.nunjucksAppEnv = nunjucksAppEnv
    next()
  })

  // Configure logging
  const loggingPreset = ENV ? 'combined' : 'dev'
  app.use(morgan(loggingPreset, {
    skip: () => ENV === 'testing'
  }))

  // TODO: FAVICON PATHS
  // Set Favicon
  // app.use(favicon(path.join(appDir, 'node_modules', 'govuk_frontend_alpha', 'assets', 'images', 'template', 'favicon.ico')))

  // Ping route
  app.use(ping.init())

  // Healthcheck route
  app.use(healthcheck.init(options.validateHealthcheck, options))

  // TODO: REMOVE IF UNNECESSARY
  // Disable indexing of svgs
  // https://github.com/18F/pa11y-crawl/issues/4
  if (ENV === 'testing') {
    options.robots = {
      body: `User-agent: *
disallow: /public`
    }
  }

  // Robots
  app.use(robots(options.robots))

  // Gzip content
  app.use(compression())

  // Support session data
  // TODO: LOOK TO FIX THIS UP
  app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: Math.round(Math.random() * 100000).toString()
  }))

  // Support for parsing data in POSTs
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  // Enable reading of cookies
  app.use(cookieParser())

  // Local values
  app.use(locals(ENV, ASSET_PATH, process.env))

  // TODO:
  // Run arbitrary routes before static routes run
  if (options.preStaticRoutes) {
    app.use(options.preStaticRoutes())
  }

  // TODO: STATIC
  // // Serve static assets

  const staticPaths = [
    path.join(appDir, ASSET_PATH),
    path.join(appDir, 'app', 'assets'),
    path.join(kitDir, 'app', 'assets')
  ]
  app.use(routesStatic(ASSET_SRC_PATH, staticPaths))

  // TODO: POST STATIC ROUTES
  // Run arbitrary routes after static routes run
  if (options.postStaticRoutes) {
    app.use(options.postStaticRoutes())
  }

  // TODO: GATEKEEPING AUTH
  // // Run everything through basic auth
  if (options.basicAuth || USERNAME) {
    app.use(auth.init(options.basicAuth || {
      username: USERNAME,
      password: PASSWORD,
      realm: REALM
    }))
  }

  // TODO: SCREENING
  // Screen users if necessary
  if (options.screenUsers) {
    app.use(options.screenUsers(ENV))
  }

  // TODO: PRE CACHED
  // Run arbitrary routes before cached output served
  if (options.preCachedRoutes) {
    app.use(options.preCachedRoutes())
  }

  // TODO: CACHED ROUTES
  // Serve cached output
  app.use(routesCached(cacheDir, ASSET_PATH))

  // TODO: POST CACHED
  // Run arbitrary routes after cached output served
  if (options.postCachedRoutes) {
    app.use(options.postCachedRoutes())
  }

  // TODO: MAIN FORM BUILDER HANDLERS
  // // Metadata-based routes
  // app.use(routesMetadata({cacheDir, appDir, kitDir}))

  // TODO: STRAIGHT UP NJK TEMPLATES
  // Simple nunjucks routes
  app.use(routesNunjucks())

  // TODO: ERROR HANDLING
  // // if we got here it's not found
  // app.use(errorHandler.notFound)

  // Sentry reports errors
  if (sentryDSN) {
    // app.use(Raven.errorHandler())
    const sentryHandler = Raven.errorHandler()
    app.use((err, req, res, next) => {
      const errCode = Number(err.message.toString())
      if (isNaN(errCode) || errCode >= 500) {
        sentryHandler(err, req, res, next)
      } else {
        errorHandler.handle(err, req, res)
      }
    })
  }

  // Handle any errors
  app.use(errorHandler.handle)

  // Fire up the app
  const server = app.listen(PORT, () => {
    logger(`App is running on localhost:${PORT}`)
    if (options.callback) {
      options.callback(server, app)
    }
  })
}

module.exports = {
  start
}
