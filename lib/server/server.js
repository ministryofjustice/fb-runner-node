'use strict'

const path = require('path')
const express = require('express')
const Raven = require('raven')
const puppeteer = require('puppeteer')
const json2csv = require('json2csv').parse
const flatten = require('flat')

// Express middleware
// const session = require('express-session')
const bodyParser = require('body-parser')
// const cookieParser = require('cookie-parser')
const morgan = require('morgan')
// const favicon = require('serve-favicon')
const compression = require('compression')

// const uuidv4 = require('uuid/v4')
// const crypto = require('crypto')

const {
  auth,
  ping,
  healthcheck,
  robots,
  nunjucksConfiguration,
  locals,
  userSession,
  userData,
  routesStatic,
  routesCached,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('../middleware/middleware')

const schemaUtils = require('@ministryofjustice/fb-specification/lib/schema-utils')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose(true)

let CONSTANTS = require('../constants/constants')
const {
  ENV,
  PORT,
  EDITABLE,
  SERVICE_PATH,
  SERVICE_TOKEN,
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
  setServiceSources,
  getInstanceProperty
} = require('../service-data/service-data')

const {format} = require('../format/format')

const schemaObjs = []

const getSchemaObjs = (specsName, specsPath) => {
  specsPath = specsPath || path.join(process.cwd(), 'node_modules', specsName)
  const packageJSON = require(`${specsName}/package.json`)
  const specs = packageJSON.specifications
  specs.path = specsPath
  return specs
}
schemaObjs.push(getSchemaObjs('@ministryofjustice/fb-components-core'))

const dataSourceObjs = []
const nodeModules = path.join(process.cwd(), 'node_modules')
const addDataSources = (source, sourcePath) => {
  if (!sourcePath) {
    sourcePath = path.join(nodeModules, source)
  }
  sourcePath = path.join(sourcePath, 'metadata')
  source = source.replace(/.*\//, '')
  dataSourceObjs.push({
    source,
    path: sourcePath
  })
}

const dataSources = ['@ministryofjustice/fb-components-core']
dataSources.forEach(addDataSources)

addDataSources('service', SERVICE_PATH)

const configureMiddleware = async (options = {}) => {
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

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({
    extended: false,
    depth: 20,
    allowDots: true,
    parseArrays: false
  }))

  // Configure nunjucks
  const nunjucksOptions = options.nunjucks || NUNJUCKSOPTIONS
  app.use(nunjucksConfiguration.init(app, SERVICE_PATH, appDir, nunjucksOptions, schemaObjs))

  // Local values
  app.use(locals.init(ENV, ASSET_PATH, CONSTANTS))

  app.use((req, res, next) => {
    // console.log('req.sessionID', req.sessionID)
    // console.log('req.session.id', req.session.id)
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

  app.use('/reset', (req, res) => {
    res.clearCookie('sessionId')
    res.redirect('/')
  })

  app.use('/favicon.ico', (req, res) => {
    res.send()
  })

  // Create user session
  app.use(userSession.init({
    serviceToken: SERVICE_TOKEN
  }))

  // Add user data methods to req.user
  app.use(userData.loadUserData)

  const controllers = require('../page/controller/controller')
  const summaryController = controllers['page.summary'] || {}

  // Someone set us up the browser - all your page are belong to us
  const browser = await puppeteer.launch({args: ['--no-sandbox']})

  const generateOutput = async (req, res) => {
    const {outputType, outputId, filename} = req.params
    const userData = Object.assign({}, req.user)
    userData.pagesMethods = {
      getUrl: () => {}
    }

    const code = getInstanceProperty('service', 'code')
    const subHeading = getInstanceProperty('service', 'pdfSubHeading')
    const heading = getInstanceProperty('service', 'pdfHeading')
    const submissionId = userData.getUserDataProperty('submissionId')
    const submissionDate = userData.getUserDataProperty('submissionDate')
    let submission = code
    if (submissionId) {
      submission += ` / ${submissionId}`
    }
    if (submissionDate) {
      const formattedDate = (new Date(submissionDate)).toUTCString()
      submission += ` / ${formattedDate}`
    }

    if (outputType === 'pdf') {
      let pageInstance = {
        _type: 'output.pdf',
        title: submission,
        sectionHeading: subHeading,
        heading
      }
      if (summaryController.setContents) {
        pageInstance = summaryController.setContents(pageInstance, userData)
      }

      let output = await nunjucksConfiguration.renderPage(pageInstance) // getPageOutput()
      output = output.replace(/<head>/, `<head><base href="http://localhost:${PORT}">`)
      output = output.replace(/<title>.*<\/title>/, `<title>${submission}</title>`)
      // const context = await browser.createIncognitoBrowserContext()
      const page = await browser.newPage()
      // await page.goto(`http://localhost:${PORT}/`)

      await page.goto(`data:text/html,${output}`, {waitUntil: 'networkidle0'})

      await page.emulateMedia('screen')
      const pdfOutput = await page.pdf({
        scale: 0.75,
        format: 'A4',
        printBackground: true,
        margin: {
          bottom: '1cm'
        },
        displayHeaderFooter: true,
        footerTemplate: `
<style>
html, body, div {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 10px;
}
.pdfFooter {
  display: block;
  border-top: solid 1px #bfc1c3;
  margin: 0 0.5cm;
  padding: 0.125cm 0;
  -webkit-print-color-adjust: exact;
  width: 100%;
  box-sizing: border-content;
}
.pdfFooter * {
  display: inline-block;
  font-family: HelveticaNeue, Helvetica, Arial, sans-serif;
}
.submission {
  float: left;
}
.pages {
  float: right;
}
</style>
<span class="pdfFooter">
<span class="submission">${submission}</span>
<span class="pages"><span class="pageNumber">pageNumber</span>/<span class="totalPages">totalPages</span></span>
</span>`
      })
      await page.goto('about:blank')
      await page.close()

      // res.setHeader('Content-Length', pdfOutput.length);
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
      // res.contentType('application/pdf')
      res.write(pdfOutput)
      res.end()
    } else if (outputType === 'email') {
      let email
      if (outputId === 'team') {
        email = getInstanceProperty('service', 'emailTemplateTeam') || 'Please find an application attached'
      } else if (outputId === 'user') {
        email = getInstanceProperty('service', 'emailTemplateUser') || 'A copy of your application is attached'
      } else {
        email = 'A copy of the application is attached'
      }
      const formatEmail = (str, markdown = false) => {
        try {
          str = format(str, req.user.getUserData(), {markdown})
        } catch (e) {
          //
        }
        return str
      }
      email = formatEmail(email)
      res.send(email)
    } else if (outputType === 'json') {
      let jsonData = userData.getOutputData()
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
      res.send(JSON.stringify(jsonData, null, 2))
      // res.json(jsonData)
    } else if (outputType === 'csv') {
      let jsonData = flatten(userData.getOutputData())
      let outputData = {}
      Object.keys(jsonData).reverse().forEach(key => {
        let normalisedKey = key
        if (key.match(/\b\d+\b/)) {
          const adjustedKey = key.replace(/\b(\d+)\b/g, (m, m1) => {
            return 1 + Number(m1)
          })
          normalisedKey = adjustedKey
        }
        outputData[normalisedKey] = jsonData[key]
      })
      const fields = Object.keys(outputData).reverse()

      // let outputStr = fields.join(',')
      // outputStr += '\n'
      // const fieldValues = fields.map(field => {
      //   let value = outputData[field]
      //   if (typeof value === 'string') {
      //     value = `"${value}"`
      //   }
      //   if (value === undefined) {
      //     value = ''
      //   }
      //   return value
      // })
      // outputStr += fieldValues.join(',')
      // outputStr += '\n'
      const csvOutput = json2csv(outputData, {fields})
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
      res.write(csvOutput)
      res.end()
    } else {
      throw new Error(404)
    }
  }

  // Convenience route to generate output for current user
  app.use('/api/submitter/:outputType/:outputId/:filename?', async (req, res) => {
    await generateOutput(req, res)
    // res.send('api submitter output using user data')
  })

  // TODO: MAIN FORM BUILDER HANDLERS
  // // Metadata-based routes
  // {cacheDir, appDir, kitDir}
  if (options.serviceData) {
    app.use(routesMetadata.init(options.serviceData, options.schemas))
  }

  // TODO: ONLY ENABLE IF REQUIRED
  // Simple nunjucks routes
  app.use(routesNunjucks.init())

  // if we got here it's not found
  app.use(errorHandlerInstance.notFound)

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
