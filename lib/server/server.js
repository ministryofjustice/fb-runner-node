'use strict'

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
  auth,
  ping,
  healthcheck,
  robots,
  nunjucksConfiguration,
  locals,
  userData,
  routesStatic,
  routesCached,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('../middleware/middleware')

const {getRuntimeData} = require('@ministryofjustice/fb-runtime-node')

const {schemas} = require('@ministryofjustice/fb-specification')
const schemaUtils = require('@ministryofjustice/fb-specification/lib/schema-utils')(schemas)

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)

let CONSTANTS = require('../constants/constants')
const {
  ENV,
  PORT,
  EDITABLE,
  SERVICEDATA,
  NUNJUCKSOPTIONS,
  USERNAME,
  PASSWORD,
  REALM,
  ASSET_PATH,
  ASSET_SRC_PATH,
  SENTRY_DSN,
  GA_TRACKING_ID
} = CONSTANTS

const {setServiceInstances} = require('../service-data/service-data')

const configureMiddleware = (options = {}) => {
  const appDir = process.cwd()
  const kitLibDir = __dirname
  const kitDir = path.resolve(kitLibDir, '..')
  const cacheDir = path.join(appDir, ASSET_PATH, 'html')

  const app = express()

  // Configure GA
  const errorHandlerInstance = errorHandler.init({GA_TRACKING_ID})

  // Configure Sentry
  const sentryDSN = SENTRY_DSN
  if (sentryDSN) {
    Raven.config(sentryDSN).install()
    app.use(Raven.requestHandler())
  }

  // Unset public announcement of express
  app.disable('x-powered-by')

  // Set views engine
  app.set('view engine', 'html')

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
  app.use(robots.init(options.robots))

  // Gzip content
  app.use(compression())

  // Support session data
  // set secure: true when proper environments
  const secure = false
  const cookiePath = '/'
  const cookieMaxAge = 30
  app.use(session({
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    secret: Math.round(Math.random() * 100000).toString(),
    cookie: {
      path: cookiePath,
      httpOnly: true,
      secure,
      maxAge: cookieMaxAge * 60 * 1000
    }
  }))

  // Support for parsing data in POSTs
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: false,
    depth: 20,
    allowDots: true,
    parseArrays: false
  }))

  // Enable reading of cookies
  app.use(cookieParser())

  // Configure nunjucks
  const nunjucksOptions = options.nunjucks || NUNJUCKSOPTIONS
  app.use(nunjucksConfiguration.init(app, appDir, kitDir, nunjucksOptions))

  // Local values
  app.use(locals.init(ENV, ASSET_PATH, CONSTANTS))

  app.use((req, res, next) => {
    let editmode = false
    if (EDITABLE) {
      const match = req._parsedUrl.pathname.match(/\/(edit|preview|flow)$/)
      if (match) {
        editmode = match[1]
      }
    }
    Object.defineProperty(req, 'editmode', {
      writeable: false,
      value: editmode
    })
    next()
  })

  // add user data methods to req.user
  app.use(userData.loadUserData)

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
  app.use(routesStatic.init(ASSET_SRC_PATH, staticPaths))

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
  app.use(routesCached.init(cacheDir, ASSET_PATH))

  // TODO: POST CACHED
  // Run arbitrary routes after cached output served
  if (options.postCachedRoutes) {
    app.use(options.postCachedRoutes())
    // options.postCachedRoutes()
  }

  // TODO: MAIN FORM BUILDER HANDLERS
  // // Metadata-based routes
  // {cacheDir, appDir, kitDir}
  if (options.serviceData) {
    app.use(routesMetadata.init(options.serviceData, options.schemas))
  }

  // TODO: STRAIGHT UP NJK TEMPLATES
  // Simple nunjucks routes
  app.use(routesNunjucks.init())

  // save user data methods
  app.use(userData.saveUserData)

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
        errorHandlerInstance.handle(err, req, res)
      }
    })
  }

  // Handle any errors
  app.use(errorHandlerInstance.handle)

  // Fire up the app
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      FBLogger(`App is running on localhost:${PORT}`)
      if (options.callback) {
        options.callback(server, app)
      }
      resolve({server, app})
    })
  })
}

const start = (options = {}) => {
  const dataSourceObjs = [{
    source: 'site',
    path: path.resolve(SERVICEDATA, 'metadata')
  }]
  return schemaUtils.load()
    .then(schemas => {
      options.schemas = schemas
      return getRuntimeData(dataSourceObjs, schemas)
    })
    .then(serviceData => {
      setServiceInstances(serviceData)
      options.serviceData = serviceData
      return configureMiddleware(options)
    })
}

module.exports = {
  start
}
