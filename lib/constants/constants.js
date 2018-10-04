const path = require('path')

const {FBError} = require('@ministryofjustice/fb-utils-node')

class FBConstantsError extends FBError {}

const {NUNJUCKS_NOCACHE, NUNJUCKS_WATCH, EDITABLE, SERVICE_TOKEN, USER_DATASTORE_URL} = process.env

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
}

const getEnvVarAsBoolean = (envVar, defaultBoolean) => {
  return defaultBoolean ? envVar !== 'false' : envVar === 'true'
}

const CONSTANTS = Object.assign({
  PORT: 3000,
  SERVICEDATA: path.join('.', 'lib', 'spec', 'servicedata')
}, process.env, {
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

SERVICEDATA
  physical location of site metadata

SERVICE_TOKEN
  Token for signing requests to user data store

USER_DATASTORE_URL
  Url for making requests to user data store

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
