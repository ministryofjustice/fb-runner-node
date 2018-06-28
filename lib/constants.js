const path = require('path')

const CONSTANTS = Object.assign({
  PORT: 3000,
  SITEDATAPATH: path.join('.', 'lib', 'spec', 'servicedata', 'metadata')
}, process.env, {
  ROUTES: {
    ping: '/ping.json',
    healthcheck: '/healthcheck.json'
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

ASSET_PATH
  physical location of assets - defaults to [root dir]/public

ASSET_SRC_PATH
  url prefix for assets - defaults to /assets

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
