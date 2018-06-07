const CONSTANTS = Object.assign({
  PORT: 3000
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
ENV
PORT
SENTRY_DSN
*/
