const moment = require('moment')
const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {evaluate} = require('../../evaluate-condition/evaluate-condition')

const {FBLogger, deepClone} = require('@ministryofjustice/fb-utils-node')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const userDataStoreClient = require('../../client/user-datastore/user-datastore')

const {
  clearSession,
  clearSessionAndRedirect,
  createSessionCookie
} = require('../user-session/user-session')

const {getFullyQualifiedUrl} = require('../../route/route')

const ENV = {
  FQDN: getFullyQualifiedUrl()
}

const dataStoreType = userDataStoreClient.offline ? 'memory' : 'remote'

const dataStoreMemory = {
  loadData: async (args, logger, data = {}) => {
    return Promise.resolve(data)
  },
  saveData: async (args) => {
    return Promise.resolve()
  }
}

const dataStoreRemote = {
  /**
  * loadData
  *
  * @param {object} args
  * Save args
  * @param {string} args.userId
  * User ID
  * @param {string} args.userToken
  * User data
  * @param {object} logger
  * Bunyan logger instance
  *
  * @return {undefined}
  */
  loadData: async (args, logger) => {
    const data = await userDataStoreClient.getData(args, logger)

    return data
  },
  /**
  * saveData
  *
  * @param {object} args
  * Save args
  * @param {string} args.userId
  * User ID
  * @param {string} args.userToken
  * User token
  * @param {object} args.payload
  * User data
  * @param {object} logger
  * Bunyan logger instance
  *
  * @return {undefined}
  */
  saveData: async (args, logger) => {
    return userDataStoreClient.setData(args, logger)
  }
}

const {loadData, saveData} = dataStoreType === 'remote' ? dataStoreRemote : dataStoreMemory

const external = {}
external.getInstanceByPropertyValue = getInstanceByPropertyValue
external.getInstanceProperty = getInstanceProperty

const removeNullEntries = (obj) => {
  Object.keys(obj).forEach(key => {
    const objProp = obj[key]
    if (Array.isArray(objProp)) {
      obj[key] = objProp
        .filter(() => true)
        .filter(value => value !== null)
    } else if (typeof objProp === 'object') {
      obj[key] = removeNullEntries(objProp)
    }
  })
  return obj
}

external.getUserDataMethods = (data = {}, params, additional = {}) => {
  let scope = 'input'
  data.input = data.input || {}
  data.count = data.count || {}
  data.flash = data.flash || []

  const countData = data.count
  const flashMessages = data.flash
  const successfulUploads = {}

  let paramsData = params

  let bodyInput

  let userId = additional.getUserId ? additional.getUserId() : undefined
  let userToken = additional.getUserToken ? additional.getUserToken() : undefined

  const getAllData = () => {
    return deepClone(data)
  }

  const getDataScope = (dataScope) => {
    const acutalScope = dataScope || scope
    data[acutalScope] = data[acutalScope] || {}
    return data[acutalScope]
  }

  const getUserDataProperty = (path, def, scope) => {
    return getBracketNotationPath(getDataScope(scope), path, def)
  }

  const getUserData = (scope) => getDataScope(scope)

  const getUserParams = () => paramsData

  const getScopedUserData = (scopeArgs = {}, displayScope) => {
    const allData = getAllData()
    let displayData = {}
    if (displayScope === 'input') {
      displayScope = 'display'
    }
    if (displayScope) {
      displayData = allData[displayScope] || {}
    }
    const userInputData = deepClone(getUserData())
    const data = Object.assign({}, userInputData, displayData)
    data._scopes = allData

    data._scopes.param = getUserParams()
    Object.keys(scopeArgs).forEach(key => {
      data._scopes[key] = Object.assign({}, data._scopes[key], scopeArgs[key])
    })

    if (additional.req) {
      const req = {
        url: additional.req.url,
        method: additional.req.method,
        lang: additional.req.lang,
        newSession: additional.req.newSession
      }
      data._scopes.req = req
    }

    data._scopes.ENV = ENV

    // TODO: check that params is not currently used anywhere
    if (data._scopes.param) {
      Object.keys(data._scopes.param).forEach(param => {
        data[`param__${param}`] = data._scopes.param[param]
      })
    }

    return data
  }

  // TODO: add a userData.format method someething along these lines
  // const format = (value, args, options) => {
  //   const formatData = Object.assign({}, getScopedUserData(), args)
  //   return format(value, formatData, options)
  // }

  const logger = additional.req && additional.req.logger ? additional.req.logger : {
    debug: () => {},
    info: () => {},
    warning: () => {},
    error: () => {},
    fatal: () => {}
  }

  const bundle = {
    logger,
    getUserId: () => userId,
    getUserToken: () => userToken,
    clearSession: () => clearSession(additional.res),
    clearSessionAndRedirect: (redirect) => clearSessionAndRedirect(additional.res, redirect),
    resetUserData: async (newUserId, newUserToken) => {
      userId = newUserId
      userToken = newUserToken
      createSessionCookie(additional.res, userId, userToken)
      const originalData = await loadData({userId, userToken}, logger)
      data = originalData
    },
    getScope: () => scope,
    setScope: (newScope) => {
      scope = newScope
      data[scope] = data[scope] || {}
    },
    evaluate: (condition, scopeArgs) => {
      const scopedData = getScopedUserData(scopeArgs)._scopes || {}
      return evaluate(condition, scopedData, scope, true)
    },
    saveData: () => {
      const payload = getAllData()
      // only perform if data has changed?
      return additional.saveData({userId, userToken, payload}, logger)
    },
    getAllData,
    getScopedUserData,
    getUserDataProperty,
    getUserData,
    getUserDataInput: () => data.input,
    getUserDataInputProperty: (path, def) => getUserDataProperty(path, def, 'input'),
    getOutputData: (scope) => {
      let output = deepClone(getDataScope(scope))
      delete output.COMPOSITE
      output = removeNullEntries(output)
      return output
    },
    setUserDataProperty: (path, value, scope) => setBracketNotationPath(getDataScope(scope), path, value),
    setUserData: (updatedData, scope) => Object.assign(getDataScope(scope), updatedData),
    unsetUserDataProperty: (path, scope) => unsetBracketNotationPath(getDataScope(scope), path),
    getUserCountProperty: (path) => {
      const count = countData[path]
      // if (count === undefined) {
      //   const reffedPage = external.getInstanceByPropertyValue('namePrefix', path)
      //   if (reffedPage) {
      //     count = external.getInstanceProperty(reffedPage._id, 'repeatableMinimum')
      //   }
      //   if (count === undefined) {
      //     count = 1
      //   }
      // }
      return count
    },
    getUserCount: () => countData,
    setUserCountProperty: (path, value) => {
      countData[path] = value
    },
    getUserParam: (param) => paramsData[param],
    getUserParams,
    setParams: (params) => {
      paramsData = params
    },
    getBodyInput: () => bodyInput || {},
    setBodyInput: (body) => {
      bodyInput = body
    },
    getFlashMessages: () => flashMessages.slice(),
    /**
     * Store flash messages until such a time they can be displayed
     * @param {object} message
     * Message object
     * @param {string} message.html
     * Message string
     * @param {string} message.type
     * Message type
     * @return {undefined}
     */
    setFlashMessage: (message) => flashMessages.push(message),
    clearFlashMessages: () => {
      flashMessages.length = 0
    },
    getSuccessfulUploadsCount: (path) => getBracketNotationPath(successfulUploads, path, 0),
    setSuccessfulUpload: (path) => {
      const currentUploads = getBracketNotationPath(successfulUploads, path, 0)
      setBracketNotationPath(successfulUploads, path, currentUploads + 1)
    }
  }
  return Object.assign({}, additional, bundle)
}

external.loadUserData = async (req, res) => {
  const userId = req.getUserId()
  const userToken = req.getUserToken()
  let data = {}

  if (!req.newSession) {
    try {
      data = await loadData({userId, userToken}, req.logger, req.session)
    } catch (err) {
      if (err.code === 404) {
        FBLogger('Failed to load data', err)
        return clearSessionAndRedirect(res)
      }
      throw err
    }
  }

  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(data,
      req.params || {},
      {
        saveData,
        req,
        res,
        getUserId: req.getUserId,
        getUserToken: req.getUserToken
      })
  })

  Object.freeze(req.user)

  if (req.newSession) {
    const now = new Date()
    const createdAt = now.toISOString()
    const dataRetentionDuration = getInstanceProperty('service', 'dataRetentionDuration')
    const expiresAt = moment(now).add(dataRetentionDuration, 'd').format('D MMMM YYYY')
    req.user.setUserDataProperty('created', createdAt, 'meta')
    req.user.setUserDataProperty('expires', expiresAt, 'meta')
    await req.user.saveData()
  }
}

module.exports = external
