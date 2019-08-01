const express = require('express')
const router = express.Router()

// Express middleware
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const compression = require('compression')
const Sentry = require('@sentry/node')

const {
  auth,
  ping,
  healthcheck,
  robots,
  referrer,
  csrf,
  nunjucksConfiguration,
  locals,
  userSession,
  userData,
  routesStatic,
  routesOutput,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('../middleware/middleware')

const useAsync = require('../middleware/use-async/use-async')
const logger = require('../middleware/logger/logger')

const CONSTANTS = require('../constants/constants')

const configureMiddleware = async (app, options = {}) => {
  const {
    serviceSources,
    ENV,
    PLATFORM_ENV,
    EDITABLE,
    SERVICE_SECRET,
    SERVICE_TOKEN,
    FQD,
    NUNJUCKSOPTIONS,
    USERNAME,
    PASSWORD,
    REALM,
    ASSET_PATH,
    ASSET_SRC_PATH,
    SENTRY_DSN,
    GA_TRACKING_ID
  } = options

  // Unset public announcement of express
  app.disable('x-powered-by')

  // Set views engine
  app.set('view engine', 'html')

  // standard apache-style logs output at request end
  const loggingPreset = PLATFORM_ENV ? 'combined' : 'dev'
  router.use(morgan(loggingPreset, {
    skip: () => ENV === 'testing'
  }))

  // Use Sentry middleware
  if (SENTRY_DSN) {
    router.use(Sentry.Handlers.requestHandler())
  }

  // Ping route
  router.use(ping.init())

  // Healthcheck route
  router.use(healthcheck.init(options.validateHealthcheck, options))

  // CORS policy - deny all
  router.use(cors({
    origin: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
  }))

  // Prevent iframing of pages
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  router.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'deny')
    next()
  })

  // Run arbitrary routes before static routes run
  if (options.preStaticRoutes) {
    router.use(options.preStaticRoutes())
  }

  // Serve static assets
  const routesStaticConfig = {
    assetsUrlPrefix: ASSET_SRC_PATH,
    staticPaths: options.staticPaths,
    serviceSources
  }
  router.use(routesStatic.init(routesStaticConfig))

  // Run arbitrary routes after static routes run
  if (options.postStaticRoutes) {
    router.use(options.postStaticRoutes())
  }

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
  router.use(robots.init(options.robots))

  // Gzip content
  router.use(compression())

  router.use(bodyParser.json())
  router.use(bodyParser.urlencoded({
    extended: false,
    depth: 20,
    allowDots: true,
    parseArrays: false
  }))

  router.use(logger.getMiddleware())

  // Configure nunjucks
  const nunjucksOptions = options.nunjucks || NUNJUCKSOPTIONS
  router.use(nunjucksConfiguration.init(app, nunjucksOptions, serviceSources))

  // Local values
  router.use(locals.init(ENV, CONSTANTS, ASSET_PATH, options.locals))

  // TODO: move to editor
  router.use((req, res, next) => {
    let editmode = false
    if (EDITABLE || !EDITABLE) {
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

  // Run everything through basic auth
  if (options.basicAuth || USERNAME) {
    router.use(auth.init(options.basicAuth || {
      username: USERNAME,
      password: PASSWORD,
      realm: REALM
    }))
  }

  // TODO: SCREENING
  // Screen users if necessary
  if (options.screenUsers) {
    router.use(options.screenUsers(ENV))
  }

  // Clear session
  router.use('/reset', (req, res) => {
    res.clearCookie('sessionId')
    res.redirect('/')
  })

  // Fallback favicon route
  router.use('/favicon.ico', (req, res) => {
    res.send()
  })

  // Create user session
  router.use(userSession.init({
    serviceSecret: SERVICE_SECRET
  }))

  // Add user data methods to req.user
  router.use(useAsync(userData.loadUserData))

  // Check referrer
  router.use(referrer.init(FQD))

  // Check csrf token
  router.use(useAsync(csrf.init(SERVICE_TOKEN)))

  // Run arbitrary routes before cached output served
  if (options.preCachedRoutes) {
    router.use(options.preCachedRoutes())
  }

  // Serve cached output would go here

  // Run arbitrary routes after cached output served
  if (options.postCachedRoutes) {
    router.use(options.postCachedRoutes())
  }

  //  Generate output
  router.use('/api/submitter', routesOutput.init())

  // Metadata-based routes
  if (options.serviceData) {
    router.use(routesMetadata.init(options.serviceData, options.schemas))
  }

  // Simple nunjucks routes (only enabled if run locally)
  if (!PLATFORM_ENV) {
    router.use(routesNunjucks.init())
  }

  // Configure error handler GA usage
  const errorHandlerInstance = errorHandler.init({GA_TRACKING_ID})

  // if reached, it's not found
  router.use(errorHandlerInstance.notFound)

  // Sentry reports errors
  if (SENTRY_DSN) {
    const sentryHandler = Sentry.Handlers.errorHandler()
    router.use((err, req, res, next) => {
      const errCode = Number(err.message.toString())
      if (isNaN(errCode) || errCode >= 500) {
        sentryHandler(err, req, res, next)
      } else {
        errorHandlerInstance.handle(err, req, res)
      }
    })
  }

  // Handle any errors
  router.use(errorHandlerInstance.handle)

  return router
}

module.exports = configureMiddleware
