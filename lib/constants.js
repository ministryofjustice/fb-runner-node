const path = require('path')

const {NUNJUCKS_NOCACHE, NUNJUCKS_WATCH} = process.env

const getEnvVarAsBoolean = (envVar, defaultBoolean) => {
  return defaultBoolean ? envVar !== 'false' : envVar === 'true'
}

const CONSTANTS = Object.assign({
  PORT: 3000,
  SITEDATAPATH: path.join('.', 'lib', 'spec', 'servicedata', 'metadata')
}, process.env, {
  ROUTES: {
    ping: '/ping.json',
    healthcheck: '/healthcheck.json'
  },
  // NB. if no ENV, should NUNJUCKSOPTIONS values be inverted automatically?
  NUNJUCKSOPTIONS: {
    noCache: getEnvVarAsBoolean(NUNJUCKS_NOCACHE, true),
    watch: getEnvVarAsBoolean(NUNJUCKS_WATCH, false)
  },
  ASSET_PATH: 'public',
  ASSET_SRC_PATH: '/assets'
})

module.exports = CONSTANTS

/*
APP_BUILD_DATE
APP_BUILD_TAG
APP_GIT_COMMIT
APP_VERSION
  deployment variables

SITEDATAPATH
  physical location of site metadata

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
