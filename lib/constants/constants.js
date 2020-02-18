require('@ministryofjustice/module-alias/register-module')(module)

const fs = require('fs')

const CommonError = require('~/fb-runner-node/error')

const getEnv = require('./get-env')
const processEnv = getEnv()

const path = require('path')
const runnerDir = path.resolve(__dirname, '..', '..')

class ConstantsError extends CommonError {}

const {
  APP_SHA,
  APP_DIR = runnerDir,
  NUNJUCKS_NOCACHE,
  NUNJUCKS_WATCH,
  EDITABLE,
  SERVICE_SLUG,
  SERVICE_SECRET,
  USER_DATASTORE_URL,
  SUBMITTER_URL,
  FORM_URL,
  PLATFORM_ENV,
  DEPLOYMENT_ENV,
  UPLOADS_DIR = '/tmp/uploads'
} = processEnv

// Ensure that both datastore url are both set or unset
if (USER_DATASTORE_URL || SUBMITTER_URL) {
  if (!USER_DATASTORE_URL) {
    throw new ConstantsError({
      code: 'ENOSERVICESLUG',
      message: 'No user data store provided'
    })
  }
  if (!SERVICE_SLUG) {
    throw new ConstantsError({
      code: 'ENOSERVICESLUG',
      message: 'No service slug provided'
    })
  }
  if (!SERVICE_SECRET) {
    throw new ConstantsError({
      code: 'ENOSERVICESECRET',
      message: 'No service secret provided'
    })
  }

  if (!SUBMITTER_URL) {
    throw new ConstantsError({
      code: 'ENOSUBMITTERURL',
      message: 'No submitter url provided'
    })
  }
}

const getEnvVarAsBoolean = (envVar, defaultBoolean) => {
  return defaultBoolean ? envVar !== 'false' : envVar === 'true'
}

const {
  FQD = FORM_URL,
  SAVE_RETURN_URL = USER_DATASTORE_URL,
  EMAIL_URL = SUBMITTER_URL,
  SMS_URL = SUBMITTER_URL
} = processEnv

const insertions = {}
insertions.RUNNER_DIR = runnerDir
insertions.APP_DIR = APP_DIR
insertions.UPLOADS_DIR = UPLOADS_DIR
if (!APP_SHA) {
  try {
    const appGitCommitValue = fs.readFileSync(path.join(runnerDir, 'APP_SHA'))
    insertions.APP_SHA = appGitCommitValue.toString().trim()
  } catch (e) {
    //
  }
}
if (FQD) {
  insertions.FQD = FQD
}
if (SAVE_RETURN_URL) {
  insertions.SAVE_RETURN_URL = SAVE_RETURN_URL
}
if (EMAIL_URL) {
  insertions.EMAIL_URL = EMAIL_URL
}
if (SMS_URL) {
  insertions.SMS_URL = SMS_URL
}
if (PLATFORM_ENV) {
  let ENVIRONMENT_DISPLAY = ''
  if (PLATFORM_ENV === 'test' || PLATFORM_ENV === 'integration') {
    ENVIRONMENT_DISPLAY = PLATFORM_ENV
  }
  if (DEPLOYMENT_ENV && DEPLOYMENT_ENV !== 'production') {
    if (ENVIRONMENT_DISPLAY) {
      ENVIRONMENT_DISPLAY += ' / '
    }
    ENVIRONMENT_DISPLAY += DEPLOYMENT_ENV
  }
  if (ENVIRONMENT_DISPLAY) {
    insertions.ENVIRONMENT_DISPLAY = ENVIRONMENT_DISPLAY
  }
}

const CONSTANTS = Object.assign({
  PORT: 3000,
  SERVICE_SECRET: '<NONE>'
},
processEnv,
insertions,
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

CONSTANTS.RUNNER_URL = getEnv().RUNNER_OVERRIDE_URL || `http://${SERVICE_SLUG}.formbuilder-services-${PLATFORM_ENV}-${DEPLOYMENT_ENV}:${CONSTANTS.PORT}`

Object.freeze(CONSTANTS)

module.exports = CONSTANTS

/*
SERVICE_SHA
  version of deployed form

APP_SHA
  version of app

APP_DIR
  location of app

RUNNER_DIR
  location of runner

SERVICE_PATH
  physical location of site metadata

SERVICE_OUTPUT_EMAIL
  email address to send form output to

SERVICE_OUTPUT_CSV
  if set eg 'true'. send email with CSV attachment to SERVICE_OUTPUT_EMAIL

SERVICE_SLUG
  Slug that identifies service within FB platform

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

SAVE_RETURN_URL
  Url for making requests to save and return api
  Currently same as USER_DATASTORE_URL

EMAIL_URL
  Url for making requests to send emails
  Currently same as SUBMITTER_URL

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

LOG_LEVEL
  Level at which bunyan should log at
*/
