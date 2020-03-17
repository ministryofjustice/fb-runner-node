require('@ministryofjustice/module-alias/register-module')(module)

// Express middleware
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const compression = require('compression')
const Sentry = require('@sentry/node')

const {
  ROUTES: {
    keepAlive: KEEP_ALIVE_URL,
    healthcheck: HEALTHCHECK_URL,
    ping: PING_URL
  }
} = require('~/fb-runner-node/constants/constants')

const {
  auth,
  ping,
  healthcheck,
  keepAlive,
  robots,
  referrer,
  csrf,
  nunjucksConfiguration,
  locals,
  userSession,
  userData,
  routesStatic,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('~/fb-runner-node/middleware/middleware')

const useAsync = require('~/fb-runner-node/middleware/use-async/use-async')
const logger = require('~/fb-runner-node/middleware/logger/logger')

const configureMiddleware = (options = {}) => {
  const {
    serviceSources,
    ENV,
    PLATFORM_ENV,
    EDITABLE,
    SERVICE_SECRET,
    SERVICE_TOKEN,
    FQD,
    USERNAME,
    PASSWORD,
    REALM,
    ASSET_PATH,
    ASSET_SRC_PATH,
    SENTRY_DSN,
    GA_TRACKING_ID
  } = options

  const middleware = []

  // standard apache-style logs output at request end
  const loggingPreset = PLATFORM_ENV ? 'combined' : 'dev'
  middleware.push(morgan(loggingPreset, {
    skip: () => ENV === 'testing'
  }))

  // Use Sentry middleware
  if (SENTRY_DSN) {
    middleware.push(Sentry.Handlers.requestHandler())
  }

  // CORS policy - deny all
  middleware.push(cors({
    origin: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
  }))

  // Prevent iframing of pages
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  middleware.push((req, res, next) => {
    res.setHeader('X-Frame-Options', 'deny')
    next()
  })

  // Run arbitrary routes before static routes run
  if (options.preStaticRoutes) {
    middleware.push(options.preStaticRoutes())
  }

  // Serve static assets
  const routesStaticConfig = {
    assetsUrlPrefix: ASSET_SRC_PATH,
    staticPaths: options.staticPaths,
    serviceSources
  }
  middleware.push(routesStatic.init(routesStaticConfig))

  // Run arbitrary routes after static routes run
  if (options.postStaticRoutes) {
    middleware.push(options.postStaticRoutes())
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
  middleware.push(robots.init(options.robots))

  // Gzip content
  middleware.push(compression())

  middleware.push(bodyParser.json())
  middleware.push(bodyParser.urlencoded({
    extended: false,
    depth: 20,
    allowDots: true,
    parseArrays: false,
    limit: '200kb'
  }))

  middleware.push(logger.getMiddleware())

  // Use nunjucks
  middleware.push(nunjucksConfiguration.getMiddleware())

  // Local values
  middleware.push(locals.init(ENV, options, ASSET_PATH, options.locals))

  // TODO: move to editor
  middleware.push((req, res, next) => {
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
    middleware.push(auth.init(options.basicAuth || {
      username: USERNAME,
      password: PASSWORD,
      realm: REALM
    }))
  }

  // TODO: SCREENING
  // Screen users if necessary
  if (options.screenUsers) {
    middleware.push(options.screenUsers(ENV))
  }

  // Fallback favicon route
  middleware.push(['/favicon.ico', (req, res) => {
    res.send()
  }])

  // Fallback favicon route
  // middleware.push(['/restricted/session-timeout', (req, res) => {
  //  res.send('{"hello":"buglers"}')
  // }])

  // Create user session
  middleware.push(userSession.init({ serviceSecret: SERVICE_SECRET }))

  // Keep user session alive route
  middleware.push([KEEP_ALIVE_URL, keepAlive.init({ serviceSecret: SERVICE_SECRET })])

  // Clear user session
  middleware.push(['/reset', (req, res) => {
    res.clearCookie('sessionId')
    res.redirect('/')
  }])

  // Ping route
  middleware.push([PING_URL, ping.init()])

  // Healthcheck route
  middleware.push([HEALTHCHECK_URL, healthcheck.init(options.validateHealthcheck, options)])

  // Add user data methods to req.user
  middleware.push(useAsync(userData.loadUserData))

  // Check referrer
  middleware.push(referrer.init(FQD))

  // Check csrf token
  middleware.push(useAsync(csrf.init(SERVICE_TOKEN)))

  // Run arbitrary routes before cached output served
  if (options.preCachedRoutes) {
    middleware.push(options.preCachedRoutes())
  }

  // Serve cached output would go here

  // Run arbitrary routes after cached output served
  if (options.postCachedRoutes) {
    middleware.push(options.postCachedRoutes())
  }

  // Metadata-based routes
  if (options.serviceData) {
    middleware.push(routesMetadata.init(options.serviceData, options.schemas))
  }

  // Simple nunjucks routes (only enabled if run locally)
  if (!PLATFORM_ENV) {
    middleware.push(routesNunjucks.init())
  }

  // Configure error handler GA usage
  const errorHandlerInstance = errorHandler.init({ GA_TRACKING_ID })

  // if reached, it's not found
  middleware.push(errorHandlerInstance.notFound)

  // Sentry reports errors
  if (SENTRY_DSN) {
    const sentryHandler = Sentry.Handlers.errorHandler()
    middleware.push((err, req, res, next) => {
      const errCode = Number(err.message.toString())
      if (isNaN(errCode) || errCode >= 500) {
        sentryHandler(err, req, res, next)
      } else {
        errorHandlerInstance.handle(err, req, res)
      }
    })
  }

  // Handle any errors
  middleware.push(errorHandlerInstance.handle)

  return middleware
}

module.exports = configureMiddleware
