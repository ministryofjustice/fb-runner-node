'use strict'

const path = require('path')
const fs = require('fs')
const {execSync} = require('child_process')
const isOnline = require('is-online')
const express = require('express')
const expressBunyan = require('express-bunyan-logger')
const bunyan = require('bunyan')

// Express middleware
const Sentry = require('@sentry/node')
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

let CONSTANTS = require('../constants/constants')
const {
  ENV,
  PLATFORM_ENV,
  DEPLOYMENT_ENV,
  LOG_LEVEL,
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
  GA_TRACKING_ID,
  SERVICE_SLUG,
  APP_VERSION
} = CONSTANTS

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
const dataSourceObjs = []
const schemaObjs = []
let componentDirs = []
let servicePath
let govukFrontendVersion

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
  servicePath = path.resolve(process.env.PWD, SERVICE_PATH)
  let govukFrontendPath

  const servicePackagePath = path.join(servicePath, 'package.json')
  const servicePackageLockPath = path.join(servicePath, 'package-lock.json')
  const serviceGitIgnorePath = path.join(servicePath, '.gitignore')
  const serviceNodeModulesPath = path.join(servicePath, 'node_modules')
  const serviceConfigPath = path.join(servicePath, 'metadata', 'config')

  const servicePackageExists = fs.existsSync(servicePackagePath)
  if (!servicePackageExists) {
    const defaultPackage = `
{
  "dependencies": {
    "@ministryofjustice/fb-components-core": "0.0.146-6"
  }
}
`
    fs.writeFileSync(servicePackagePath, defaultPackage)
    const serviceConfigFilePath = path.join(serviceConfigPath, 'service.json')
    const serviceConfig = require(serviceConfigFilePath)
    if (!serviceConfig._isa) {
      serviceConfig._isa = '@ministryofjustice/fb-components-core=>service'
      fs.writeFileSync(serviceConfigFilePath, JSON.stringify(serviceConfig, null, 2))
    }
  }

  if (!fs.existsSync(serviceGitIgnorePath)) {
    const defaultGitIgnore = `
node_modules
.DS_Store
`
    fs.writeFileSync(serviceGitIgnorePath, defaultGitIgnore)
  }

  const cleanupPackage = !servicePackageExists ? `rm ${servicePackagePath} && rm ${servicePackageLockPath}` : ''

  if (!PLATFORM_ENV) {
    let online
    try {
      online = await isOnline()
    } catch (e) {
    //
    }
    let hasServiceNoduleModules = fs.existsSync(serviceNodeModulesPath)
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

  execSync(`cd ${servicePath} && npm install`)

  const servicePackage = require(servicePackagePath)
  const servicePackageLock = require(servicePackageLockPath)
  const serviceDependencies = Object.keys(servicePackage.dependencies)
  const serviceLockDependencies = servicePackageLock.dependencies

  if (cleanupPackage) {
    try {
      execSync(cleanupPackage)
    } catch (e) {
    //
    }
  }

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
    const sourceEnvVar = `MODULE__${source}`.replace(/@/g, '').replace(/[-/]/g, '_')
    const sourceEnvVarValue = process.env[sourceEnvVar]
    const sourcePath = sourceEnvVarValue || path.join(serviceNodeModules, source)
    if (source === 'govuk-frontend') {
      govukFrontendPath = sourcePath
    }
    if (sourceEnvVarValue) {
      FBLogger('Overriding components module', {sourceEnvVar, sourcePath})
    }
    return {
      source,
      sourcePath
    }
  })

  const getSchemaObjs = (dataSource) => {
    const {sourcePath} = dataSource
    let specs = {}
    try {
      const packageJSON = require(path.join(sourcePath, 'package.json'))
      specs = packageJSON.specifications
    } catch (e) {
    //
    }
    if (specs) {
      specs.path = sourcePath
    }
    return specs
  }

  // Load modules config
  const modulesPath = path.join(kitDir, 'module')
  const fbModules = fs.readdirSync(modulesPath)

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
    fs.writeFileSync(modulesConfigPath, modulesConfigData)
    FBLogger('Generated modules config file', modulesConfigPath)
  }

  // Load any enabled modules
  fbModules.forEach(module => {
    const moduleConfig = modulesConfig.modules.filter(moduleConfig => module === moduleConfig.module)[0]
    if (moduleConfig.enabled !== 'on') {
      return
    }
    FBLogger(`Enabled module ${module}`)
    componentDirs.push({
      source: `module:${module}`,
      sourcePath: path.join(modulesPath, module),
      module
    })
  })

  componentDirs.forEach(dataSource => {
    const objs = getSchemaObjs(dataSource)
    if (objs) {
      schemaObjs.push(objs)
    }
  })

  const addDataSources = (dataSource) => {
    let {source, sourcePath} = dataSource
    if (!sourcePath) {
      sourcePath = path.join(serviceNodeModules, source)
    }
    sourcePath = path.join(sourcePath, 'metadata')
    try {
      fs.statSync(sourcePath)
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

  initControllers()
  componentDirs.reverse().forEach(dataSource => {
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

  // Patch govukHint to allow block-level elements
  const hintTemplatePath = path.join(govukFrontendPath, 'components', 'hint', 'template.njk')
  if (fs.existsSync(hintTemplatePath)) {
    let hintTemplate = fs.readFileSync(hintTemplatePath).toString()
    hintTemplate = hintTemplate.replace(/(<\/*)span/g, '$1div')
    fs.writeFileSync(hintTemplatePath, hintTemplate)
  }

  govukFrontendVersion = require(path.join(govukFrontendPath, 'package.json')).version
}

const configureMiddleware = async (options = {}) => {
  const app = express()

  // Configure bunyan for logging request immediately
  // resulting logger is available as req.log
  let logLevel = LOG_LEVEL
  if (!logLevel) {
    logLevel = PLATFORM_ENV ? 'info' : 'error'
  }
  const bunyanOptions = {
    PLATFORM_ENV,
    DEPLOYMENT_ENV,
    SERVICE_SLUG,
    name: 'fb-runner',
    level: logLevel,
    immediate: true,
    serializers: {
      req: (req) => {
        const output = bunyan.stdSerializers.req(req)
        if (output.headers && output.headers.cookie) {
          output.headers.cookie = '[REDACTED]'
        }
        return output
      },
      res: (res) => {
        const output = bunyan.stdSerializers.res(res)
        if (output.headers && output.headers['set-cookie']) {
          output.headers['set-cookie'] = '[REDACTED]'
        }
        return output
      }
    }
  }
  app.use(expressBunyan(bunyanOptions))

  // standard apache-style logs
  const loggingPreset = PLATFORM_ENV ? 'combined' : 'dev'
  app.use(morgan(loggingPreset, {
    skip: () => ENV === 'testing'
  }))

  // Configure GA
  const errorHandlerInstance = errorHandler.init({GA_TRACKING_ID})

  // Configure Sentry
  const sentryDSN = SENTRY_DSN
  if (sentryDSN) {
    Sentry.init({
      dsn: sentryDSN,
      environment: `${PLATFORM_ENV} / ${DEPLOYMENT_ENV}`,
      release: APP_VERSION
    })

    Sentry.configureScope(scope => {
      scope.setExtra('PLATFORM_ENV', PLATFORM_ENV)
      scope.setExtra('DEPLOYMENT_ENV', DEPLOYMENT_ENV)
      scope.setExtra('SERVICE_SLUG', SERVICE_SLUG)
    })

    app.use(Sentry.Handlers.requestHandler())
  }

  // Unset public announcement of express
  app.disable('x-powered-by')

  // Set views engine
  app.set('view engine', 'html')

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
    componentDirs
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
  app.use(useAsync(userData.loadUserData))

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

  // Simple nunjucks routes (only enabled if run locally)
  if (!PLATFORM_ENV) {
    app.use(routesNunjucks.init())
  }

  // if reached, it's not found
  app.use(errorHandlerInstance.notFound)

  // Sentry reports errors
  if (sentryDSN) {
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
  try {
    await prepareServiceSources()
    setServiceSources(dataSourceObjs)

    const schemas = await schemaUtils(schemaObjs).load()

    setServiceSchemas(schemas)
    options.schemas = schemas

    const serviceData = await loadServiceData()
    options.serviceData = serviceData

    await configureMiddleware(options)
  } catch (err) {
    throw err
  }
}

module.exports = {
  start
}
