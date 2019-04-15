'use strict'

const path = require('path')
const fs = require('fs')
const {execSync} = require('child_process')
const express = require('express')

// Express middleware
const Raven = require('raven')
const cors = require('cors')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const compression = require('compression')

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
  routesCached,
  routesOutput,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('../middleware/middleware')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)

const schemaUtils = require('@ministryofjustice/fb-specification/lib/schema-utils')

let CONSTANTS = require('../constants/constants')
const {
  ENV,
  PORT,
  EDITABLE,
  SERVICE_PATH,
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
} = CONSTANTS

const {
  loadServiceData,
  setServiceSchemas,
  setServiceSources
} = require('../service-data/service-data')

const servicePath = path.resolve(process.env.PWD, SERVICE_PATH)

const servicePackagePath = path.join(servicePath, 'package.json')
const servicePackageLockPath = path.join(servicePath, 'package-lock.json')
const serviceGitIgnorePath = path.join(servicePath, '.gitignore')

const servicePackageExists = fs.existsSync(servicePackagePath)
if (!servicePackageExists) {
  const defaultPackage = `
{
  "dependencies": {
    "@ministryofjustice/fb-components-core": "https://github.com/ministryofjustice/fb-components-core.git"
  }
}
`
  fs.writeFileSync(servicePackagePath, defaultPackage)
}

if (!fs.existsSync(serviceGitIgnorePath)) {
  const defaultGitIgnore = `
node_modules
.DS_Store
`
  fs.writeFileSync(serviceGitIgnorePath, defaultGitIgnore)
}

const cleanupPackage = !servicePackageExists ? `rm ${servicePackagePath} && rm ${servicePackageLockPath}` : ''

execSync(`cd ${servicePath} && npm install`)

const servicePackage = require(servicePackagePath)
const servicePackageLock = require(servicePackageLockPath)
const serviceDependencies = Object.keys(servicePackage.dependencies)
const serviceLockDependencies = servicePackageLock.dependencies

if (cleanupPackage) {
  execSync(cleanupPackage)
}

let componentDirs = []

const addDependencies = (deps) => {
  componentDirs = componentDirs.concat(deps)
  deps.forEach(dep => {
    const entry = serviceLockDependencies[dep]
    if (entry.requires) {
      const requiredDeps = Object.keys(entry.requires)
      addDependencies(requiredDeps)
    }
  })
}
addDependencies(serviceDependencies)

const serviceNodeModules = path.join(servicePath, 'node_modules')

componentDirs = componentDirs.map(source => {
  return {
    source,
    sourcePath: path.join(serviceNodeModules, source)
  }
})

const schemaObjs = []

const getSchemaObjs = (dataSource) => {
  const {sourcePath} = dataSource
  const packageJSON = require(path.join(sourcePath, 'package.json'))
  const specs = packageJSON.specifications
  if (specs) {
    specs.path = sourcePath
  }
  return specs
}

componentDirs.forEach(dataSource => {
  const objs = getSchemaObjs(dataSource)
  if (objs) {
    schemaObjs.push(objs)
  }
})

const dataSourceObjs = []
const addDataSources = (dataSource) => {
  let {source, sourcePath} = dataSource
  if (!sourcePath) {
    sourcePath = path.join(serviceNodeModules, source)
  }
  sourcePath = path.join(sourcePath, 'metadata')
  try {
    fs.statSync(sourcePath)
    source = source.replace(/.*\//, '')
    dataSourceObjs.push({
      source,
      path: sourcePath
    })
  } catch (e) {
    // don't add data source as it doesn't exist
  }
}

componentDirs.forEach(dataSource => {
  addDataSources(dataSource)
})

addDataSources({
  source: 'service',
  sourcePath: servicePath
})

const govukFrontentPath = path.join(serviceNodeModules, 'govuk-frontend')
// Patch govukHint to allow block-level elements
const hintTemplatePath = path.join(govukFrontentPath, 'components', 'hint', 'template.njk')
if (fs.existsSync(hintTemplatePath)) {
  let hintTemplate = fs.readFileSync(hintTemplatePath).toString()
  hintTemplate = hintTemplate.replace(/(<\/*)span/g, '$1div')
  fs.writeFileSync(hintTemplatePath, hintTemplate)
}

const govukFrontendVersion = require(path.join(govukFrontentPath, 'package.json')).version

const appDir = process.cwd()
const kitLibDir = __dirname
const kitDir = path.resolve(kitLibDir, '..')
const cacheDir = path.join(appDir, ASSET_PATH, 'html')

const configureMiddleware = async (options = {}) => {
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

  // CORS policy - deny all
  app.use(cors({
    origin: false,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
  }))

  // Prevent iframing of pages
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'deny')
    next()
  })

  // Run arbitrary routes before static routes run
  if (options.preStaticRoutes) {
    app.use(options.preStaticRoutes())
  }

  // Serve static assets
  const staticPaths = [
    path.join(appDir, ASSET_PATH),
    path.join(appDir, 'app', 'assets'),
    path.join(kitDir, 'app', 'assets')
  ]
  app.use(routesStatic.init(ASSET_SRC_PATH, staticPaths, servicePath))

  // Run arbitrary routes after static routes run
  if (options.postStaticRoutes) {
    app.use(options.postStaticRoutes())
  }

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

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: false,
    depth: 20,
    allowDots: true,
    parseArrays: false
  }))

  // Configure nunjucks
  const nunjucksOptions = options.nunjucks || NUNJUCKSOPTIONS
  app.use(nunjucksConfiguration.init(app, servicePath, appDir, nunjucksOptions, componentDirs))

  // Local values
  app.use(locals.init(ENV, CONSTANTS, ASSET_PATH, govukFrontendVersion))

  // TODO: move to editor
  app.use((req, res, next) => {
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

  // Clear session
  app.use('/reset', (req, res) => {
    res.clearCookie('sessionId')
    res.redirect('/')
  })

  // Fallback favicon route
  app.use('/favicon.ico', (req, res) => {
    res.send()
  })

  // Create user session
  app.use(userSession.init({
    serviceSecret: SERVICE_SECRET
  }))

  // Add user data methods to req.user
  app.use(userData.loadUserData)

  // Check referrer
  app.use(referrer.init(FQD))

  // Check csrf token
  app.use(csrf.init(SERVICE_TOKEN))

  // Run arbitrary routes before cached output served
  if (options.preCachedRoutes) {
    app.use(options.preCachedRoutes())
  }

  // Serve cached output
  app.use(routesCached.init(cacheDir, ASSET_PATH))

  // Run arbitrary routes after cached output served
  if (options.postCachedRoutes) {
    app.use(options.postCachedRoutes())
  }

  //  Generate output
  app.use('/api/submitter', routesOutput.init())

  // Metadata-based routes
  if (options.serviceData) {
    app.use(routesMetadata.init(options.serviceData, options.schemas))
  }

  // TODO: ONLY ENABLE IF REQUIRED
  // Simple nunjucks routes
  app.use(routesNunjucks.init())

  // if reached, it's not found
  app.use(errorHandlerInstance.notFound)

  // Sentry reports errors
  if (sentryDSN) {
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
  setServiceSources(dataSourceObjs)
  return schemaUtils(schemaObjs).load()
    .then(schemas => {
      setServiceSchemas(schemas)
      options.schemas = schemas
      return loadServiceData() // !EDITABLE
    })
    .then(serviceData => {
      // setServiceInstances(serviceData) //  !EDITABLE
      options.serviceData = serviceData
      return configureMiddleware(options)
    })
}

module.exports = {
  start
}
