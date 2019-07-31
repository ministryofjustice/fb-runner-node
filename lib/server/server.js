'use strict'

// Grab values from ENV or fallbacks
const CONSTANTS = require('../constants/constants')
const {
  ENV,
  PLATFORM_ENV,
  DEPLOYMENT_ENV,
  LOG_LEVEL,
  PORT,
  EDITABLE,
  COMPONENTS_MODULE,
  COMPONENTS_VERSION,
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
  GA_TRACKING_ID,
  SERVICE_SLUG,
  APP_VERSION
} = CONSTANTS

const {serializeRequest} = require('../middleware/serializers/serializers')
const Sentry = require('@sentry/node')
// Configure Sentry
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: `${PLATFORM_ENV} / ${DEPLOYMENT_ENV}`,
    release: APP_VERSION,
    beforeSend: (event) => {
      if (event.request) {
        event.request = serializeRequest(event.request)
      }
      return event
    }
  })

  Sentry.configureScope(scope => {
    scope.setExtra('PLATFORM_ENV', PLATFORM_ENV)
    scope.setExtra('DEPLOYMENT_ENV', DEPLOYMENT_ENV)
    scope.setExtra('SERVICE_SLUG', SERVICE_SLUG)
  })
}

// Create express server
const express = require('express')
const app = express()

// Configure prometheus
// metrics client is available as metrics.getClient
const metrics = require('../middleware/metrics/metrics')
metrics.init(app, {
  defaultLabels: {
    PLATFORM_ENV,
    DEPLOYMENT_ENV,
    SERVICE_SLUG
  }
})

// Configure bunyan for logging request immediately
// application-level logger is available as logger.getLogger
// per-request child logger is available as req.logger
const logger = require('../middleware/logger/logger')
const loggerMiddleware = logger.init({
  LOG_LEVEL,
  PLATFORM_ENV,
  DEPLOYMENT_ENV,
  SERVICE_SLUG
})

const path = require('path')
const {
  existsSync,
  readdirSync,
  writeFileSync
} = require('fs')
const {execSync} = require('child_process')
const isOnline = require('is-online')

// Express middleware
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

const {FBLogger, FBError} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)
class FBServerError extends FBError {}

const schemaUtils = require('@ministryofjustice/fb-specification/lib/schema-utils')

const {
  loadServiceData,
  setServiceSchemas,
  setServiceSources
} = require('../service-data/service-data')

const useAsync = require('../middleware/use-async/use-async')

const {
  initControllers,
  addControllers,
  addModule
} = require('../controller/controller')

// data and schema resources to be loaded

const appDir = process.cwd()
const kitLibDir = __dirname
const kitDir = path.resolve(kitLibDir, '..')
const cacheDir = path.join(appDir, ASSET_PATH, 'html')

const prepareServiceSources = async () => {
  if (!SERVICE_PATH) {
    throw new FBServerError({
      code: 'ENOSERVICEPATH',
      message: 'No value for SERVICEPATH (path to service metadata) provided'
    })
  }
  const servicePath = path.resolve(process.env.PWD, SERVICE_PATH)

  const servicePackagePath = path.join(servicePath, 'package.json')
  const servicePackageLockPath = path.join(servicePath, 'package-lock.json')
  const serviceGitIgnorePath = path.join(servicePath, '.gitignore')
  const serviceNodeModulesPath = path.join(servicePath, 'node_modules')
  const serviceConfigPath = path.join(servicePath, 'metadata', 'config')

  const servicePackageExists = existsSync(servicePackagePath)
  if (!servicePackageExists) {
    // Create package.json with default components dependencies
    const defaultPackage = `
{
  "dependencies": {
    "${COMPONENTS_MODULE}": "${COMPONENTS_VERSION}"
  }
}
`
    writeFileSync(servicePackagePath, defaultPackage)

    // update service config if needed
    // NB. this can be removed once https://github.com/ministryofjustice/fb-service-starter/pull/2 has been merged
    const serviceConfigFilePath = path.join(serviceConfigPath, 'service.json')
    const serviceConfig = require(serviceConfigFilePath)
    if (!serviceConfig._isa) {
      serviceConfig._isa = `${COMPONENTS_MODULE}=>service`
      writeFileSync(serviceConfigFilePath, JSON.stringify(serviceConfig, null, 2))
    }
  }

  // Ensure that a sensible .gitignore file exists
  if (!existsSync(serviceGitIgnorePath)) {
    const defaultGitIgnore = `
node_modules
.DS_Store
package.json
package-lock.json
`
    writeFileSync(serviceGitIgnorePath, defaultGitIgnore)
  }

  // ensure that any auto-generated package files are deleted whatever happens
  let cleanupPackage = () => {}
  if (!servicePackageExists) {
    cleanupPackage = () => {
      try {
        execSync(`rm ${servicePackagePath} && rm ${servicePackageLockPath}`)
      } catch (e) {
        //
      }
    }
  }

  if (!PLATFORM_ENV) {
    let online
    try {
      online = await isOnline()
    } catch (e) {
    //
    }
    const hasServiceNoduleModules = existsSync(serviceNodeModulesPath)
    // do not delete previously installed service node_modules if defined in an existing package.json
    if (hasServiceNoduleModules && online && !servicePackageExists) {
      execSync(`rm -rf ${serviceNodeModulesPath}`)
    } else if (!hasServiceNoduleModules && !online) {
      // no service node_modules and no internet connection is a brick wall
      // TODO: stash fb-components-core locally and copy that if defaulting to latest
      throw new FBServerError({
        code: 'ENOINSTALLDEPENDENCIES',
        message: `${SERVICE_PATH} does not have its dependencies installed and there is no internet connection`
      })
    }
  }

  try {
    execSync(`cd ${servicePath} && npm install`)
  } catch (e) {
    cleanupPackage()
    throw e
  }

  const servicePackage = require(servicePackagePath)
  const servicePackageLock = require(servicePackageLockPath)
  const serviceDependencies = Object.keys(servicePackage.dependencies)
  const serviceLockDependencies = servicePackageLock.dependencies

  cleanupPackage()

  // Recursively determine service dependencies by inspecting package-lock entries
  let componentSources = []
  const addDependencies = (deps) => {
    componentSources = componentSources.concat(deps)
    deps.forEach(dep => {
      const entry = serviceLockDependencies[dep]
      if (entry.requires) {
        const requiredDeps = Object.keys(entry.requires)
        addDependencies(requiredDeps)
      }
    })
  }
  addDependencies(serviceDependencies)

  // Determine actual locations of service dependencies
  componentSources = componentSources.map(source => {
    const sourceEnvVar = `MODULE__${source}`.replace(/@/g, '').replace(/[-/]/g, '_')
    const sourceEnvVarValue = process.env[sourceEnvVar]
    const sourcePath = sourceEnvVarValue || path.join(serviceNodeModulesPath, source)
    if (sourceEnvVarValue) {
      FBLogger('Overriding components module', {sourceEnvVar, sourcePath})
    }
    return {
      source,
      sourcePath
    }
  }).reverse()

  // Extract govuk-frontend version
  // and perform any needed manipulation of source directory
  let govukFrontendVersion
  componentSources = componentSources.map(sourceObj => {
    const {source, sourcePath} = sourceObj
    if (source === 'govuk-frontend') {
      govukFrontendVersion = require(path.join(sourcePath, 'package.json')).version
      if (parseInt(govukFrontendVersion, 10) >= 3) {
        sourceObj.sourcePath = path.join(sourcePath, 'govuk')
      }
    }
    return sourceObj
  })

  // Load modules config
  const modulesPath = path.join(kitDir, 'module')
  const fbModules = readdirSync(modulesPath)

  const modulesConfigPath = path.join(serviceConfigPath, 'config.modules.json')
  let modulesConfig
  let modulesConfigRewrite
  try {
    modulesConfig = require(modulesConfigPath)
  } catch (e) {
    modulesConfig = {
      _id: 'config.modules',
      _type: 'config.modules',
      modules: []
    }
    modulesConfigRewrite = true
  }

  // Add any modules to config we don't know about
  fbModules.forEach(module => {
    const moduleId = `config.module.${module}`
    const hasModuleConfig = modulesConfig.modules.filter(moduleConfig => moduleConfig._id === moduleId).length
    if (!hasModuleConfig) {
      const modulePackagePath = path.join(modulesPath, module, 'package.json')
      const modulePackage = require(modulePackagePath)
      modulesConfig.modules.push({
        _id: moduleId,
        _type: 'config.module',
        enabled: 'off',
        module,
        title: modulePackage.title
      })
      modulesConfigRewrite = true
    }
  })

  // Remove any modules from config that the runner does not have
  const modulesCount = modulesConfig.modules.length
  modulesConfig.modules = modulesConfig.modules.filter(moduleConfig => fbModules.includes(moduleConfig.module))
  if (modulesCount !== modulesConfig.modules.length) {
    modulesConfigRewrite = true
  }

  // Rewrite config.modules if updated
  if (modulesConfigRewrite) {
    const modulesConfigData = JSON.stringify(modulesConfig, null, 2)
    writeFileSync(modulesConfigPath, modulesConfigData)
    FBLogger('Generated modules config file', modulesConfigPath)
  }

  // Load any enabled modules
  fbModules.forEach(module => {
    const moduleConfig = modulesConfig.modules.filter(moduleConfig => module === moduleConfig.module)[0]
    if (moduleConfig.enabled !== 'on') {
      return
    }
    FBLogger(`Enabled module ${module}`)
    componentSources.push({
      source: `module:${module}`,
      sourcePath: path.join(modulesPath, module),
      module
    })
  })

  // Add app and service paths
  componentSources.push({
    source: 'app',
    sourcePath: appDir
  })
  componentSources.push({
    source: 'service',
    sourcePath: servicePath
  })

  // Load view and component controllers
  initControllers()
  // reverse()
  componentSources.forEach(dataSource => {
    if (!dataSource.module) {
      return
    }
    try {
      const controllers = require(path.join(dataSource.sourcePath, 'controller', 'controller'))
      addControllers(controllers)
    } catch (e) {
    // no controllers
    }
    try {
      const entrypoint = require(path.join(dataSource.sourcePath, 'controller', dataSource.module))
      addModule(dataSource.module, entrypoint)
    } catch (e) {
    // no entrypoint
    }
  })

  // Get specification objects for component paths
  const specificationSources = []
  componentSources.forEach(specificationSource => {
    const {sourcePath} = specificationSource
    let specs = {}
    try {
      const packageJSON = require(path.join(sourcePath, 'package.json'))
      specs = packageJSON.specifications
    } catch (e) {
    //
    }
    if (specs && specs.$idRoot) {
      specs.path = sourcePath
    } else {
      specs = undefined
    }
    if (specs) {
      specificationSources.push(specs)
    }
  })

  // Get data sources for component paths
  const metadataSources = []
  componentSources.forEach(metadataSource => {
    console.log({dataSource: metadataSource})
    let {source, sourcePath} = metadataSource
    if (!sourcePath) {
      sourcePath = path.join(serviceNodeModulesPath, source)
    }
    sourcePath = path.join(sourcePath, 'metadata')
    if (existsSync(sourcePath)) {
      metadataSources.push({
        source,
        path: sourcePath
      })
    }
  })

  return {
    specificationSources,
    metadataSources,
    componentSources,
    locals: {
      govuk_frontend_version: govukFrontendVersion
    }
  }
}

const configureMiddleware = async (options = {}) => {
  const {
    componentSources
  } = options
  // Unset public announcement of express
  app.disable('x-powered-by')

  // Set views engine
  app.set('view engine', 'html')

  // standard apache-style logs output at request end
  const loggingPreset = PLATFORM_ENV ? 'combined' : 'dev'
  app.use(morgan(loggingPreset, {
    skip: () => ENV === 'testing'
  }))

  // Use Sentry middleware
  if (SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler())
  }

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

  const routesStaticConfig = {
    assetsUrlPrefix: ASSET_SRC_PATH,
    staticPaths,
    componentSources
  }

  app.use(routesStatic.init(routesStaticConfig))

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

  app.use(loggerMiddleware)

  // Configure nunjucks
  const nunjucksOptions = options.nunjucks || NUNJUCKSOPTIONS
  app.use(nunjucksConfiguration.init(app, nunjucksOptions, componentSources))

  // Local values
  app.use(locals.init(ENV, CONSTANTS, ASSET_PATH, options.locals))

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
  app.use(useAsync(userData.loadUserData))

  // Check referrer
  app.use(referrer.init(FQD))

  // Check csrf token
  app.use(useAsync(csrf.init(SERVICE_TOKEN)))

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

  // Simple nunjucks routes (only enabled if run locally)
  if (!PLATFORM_ENV) {
    app.use(routesNunjucks.init())
  }

  // Configure error handler GA usage
  const errorHandlerInstance = errorHandler.init({GA_TRACKING_ID})

  // if reached, it's not found
  app.use(errorHandlerInstance.notFound)

  // Sentry reports errors
  if (SENTRY_DSN) {
    const sentryHandler = Sentry.Handlers.errorHandler()
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

const start = async (options = {}) => {
  const {
    metadataSources,
    specificationSources,
    componentSources,
    locals
  } = await prepareServiceSources()

  setServiceSources(metadataSources)

  const schemas = await schemaUtils(specificationSources).load()

  setServiceSchemas(schemas)
  options.schemas = schemas

  const serviceData = await loadServiceData()
  options.serviceData = serviceData
  options.componentSources = componentSources
  options.locals = locals

  await configureMiddleware(options)
}

module.exports = {
  start
}
