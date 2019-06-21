const {FBError} = require('@ministryofjustice/fb-utils-node')

class FBConstantsError extends FBError {}

const getEnv = require('./get-env')
const processEnv = getEnv()

const {
  NUNJUCKS_NOCACHE,
  NUNJUCKS_WATCH,
  EDITABLE,
  SERVICE_SLUG,
  SERVICE_TOKEN,
  SERVICE_SECRET,
  USER_DATASTORE_URL,
  SUBMITTER_URL,
  FORM_URL,
  PLATFORM_ENV,
  DEPLOYMENT_ENV
} = processEnv

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
  SERVICE_TOKEN: '<NONE>',
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
