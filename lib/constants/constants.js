const path = require('path')

const {FBError} = require('@ministryofjustice/fb-utils-node')

class FBConstantsError extends FBError {}

const getEnv = require('./get-env')
const processEnv = getEnv()

const {NUNJUCKS_NOCACHE, NUNJUCKS_WATCH, EDITABLE, SERVICE_SLUG, SERVICE_TOKEN, SERVICE_SECRET, USER_DATASTORE_URL, SUBMITTER_URL} = processEnv

// Ensure that both service token and datastore url are both set or unset
if (SERVICE_TOKEN || USER_DATASTORE_URL) {
  if (!SERVICE_TOKEN) {
    throw new FBConstantsError({
      code: 'ENOSERVICETOKEN',
      message: 'No service token provided though user datastore url was set'
    })
  }
  if (!USER_DATASTORE_URL) {
    throw new FBConstantsError({
      code: 'ENOUSERDATASTOREURL',
      message: 'No user datastore url provided though service token was set'
    })
  }
  if (!SERVICE_SLUG) {
    throw new FBConstantsError({
      code: 'ENOSERVICESLUG',
      message: 'No service slug provided though service token and user datastore url were set'
    })
  }
  if (!SERVICE_SECRET) {
    throw new FBConstantsError({
      code: 'ENOSERVICESECRET',
      message: 'No service secret provided though service token and user datastore url were set'
    })
  }
}

// Kludges before env vars passed properly
let kludgedVars = {}

if (SUBMITTER_URL) {
  if (!SERVICE_TOKEN) {
    throw new FBConstantsError({
      code: 'ENOSERVICETOKEN',
      message: 'No service token provided though submitter url was set'
    })
  }
  if (!SUBMITTER_URL) {
    throw new FBConstantsError({
      code: 'ENOSUBMITTERURL',
      message: 'No submitter url provided though service token was set'
    })
  }
  if (!SERVICE_SLUG) {
    throw new FBConstantsError({
      code: 'ENOSERVICESLUG',
      message: 'No service slug provided though service token and submitter url were set'
    })
  }

  const submitterMatch = SUBMITTER_URL.match(/.*\.formbuilder-platform-([^-]+?)-([^-]+?)\/*$/)
  if (submitterMatch) {
    const PLATFORM_ENV = submitterMatch[1]
    const DEPLOYMENT_ENV = submitterMatch[2]
    const FQD = `https://${SERVICE_SLUG}-${PLATFORM_ENV}-${DEPLOYMENT_ENV}.apps.live-1.cloud-platform.service.justice.gov.uk`
    kludgedVars = {
      PLATFORM_ENV,
      DEPLOYMENT_ENV,
      FQD
    }
  }
}

const getEnvVarAsBoolean = (envVar, defaultBoolean) => {
  return defaultBoolean ? envVar !== 'false' : envVar === 'true'
}

const CONSTANTS = Object.assign({
  PORT: 3000,
  SERVICE_PATH: path.join('.', 'lib', 'spec', 'servicedata'),
  SERVICE_TOKEN: '<NONE>',
  SERVICE_SECRET: '<NONE>'
},
kludgedVars,
processEnv,
{
  ROUTES: {
    ping: '/ping.json',
    healthcheck: '/healthcheck.json'
  },
  EDITABLE: getEnvVarAsBoolean(EDITABLE, false),
  // NB. if no ENV, should NUNJUCKSOPTIONS values be inverted automatically?
  NUNJUCKSOPTIONS: {
    noCache: getEnvVarAsBoolean(NUNJUCKS_NOCACHE, true),
    watch: getEnvVarAsBoolean(NUNJUCKS_WATCH, false)
  },
  ASSET_PATH: 'public',
  ASSET_SRC_PATH: '/assets'
})

Object.freeze(CONSTANTS)

module.exports = CONSTANTS

/*
APP_BUILD_DATE
APP_BUILD_TAG
APP_GIT_COMMIT
APP_VERSION
  deployment variables

SERVICE_PATH
  physical location of site metadata

SERVICE_OUTPUT_EMAIL
  email address to send form output to

SERVICE_SLUG
  Slug that identifies service within FB platform

SERVICE_TOKEN
  Token for signing requests to platform apis

SERVICE_SECRET
  Secret for encrypting values that should only be accessible by runner

DEPLOYMENT_ENV
  Deployment environment which form is deployed to

PLATFORM_ENV
  Platform environment which form is deployed to

FQD
  Fully qualified domain name for form

USER_DATASTORE_URL
  Url for making requests to user datastore

USER_FILESTORE_URL
  Url for making requests to user filestore

SUBMITTER_URL
  Url for making requests to submitter

ASSET_PATH - CURRENTLY FIXED
  physical location of assets - defaults to [root dir]/public

ASSET_SRC_PATH - CURRENTLY FIXED
  url prefix for assets - defaults to /assets

NUNJUCKS_NOCACHE
  whether nunjucks should not cache output (true|false) defaults to true

NUNJUCKS_WATCH
  whether nunjucks should watch templates (true|false) defaults to false

ENV
  environment type

PORT
  port to listen on - defaults to 3000

GA_TRACKING_ID
  Google Analytics ID

SENTRY_DSN
  Sentry ID

USERNAME
PASSWORD
REALM
  Basic auth details
*/
