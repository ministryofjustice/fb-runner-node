const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {evaluate} = require('../../evaluate-condition/evaluate-condition')

const {FBLogger, deepClone} = require('@ministryofjustice/fb-utils-node')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const userDataStoreClient = require('../../client/user-datastore/user-datastore')

/* eslint-disable no-unused-vars */
const {createSessionCookie} = require('../user-session/user-session')
/* eslint-enable no-unused-vars */

const {getFullyQualifiedUrl} = require('../../route/route')

const ENV = {
  FQDN: getFullyQualifiedUrl()
}

const dataStoreType = userDataStoreClient ? 'remote' : 'memory'

const dataStoreMemory = {
  loadData: async (userId, userToken, data) => {
    return Promise.resolve(data)
  },
  saveData: async (userId, userToken, userData) => {
    return Promise.resolve()
  }
}

const dataStoreRemote = {
  loadData: async (userId, userToken) => {
    let data = {}
    try {
      data = await userDataStoreClient.getData(userId, userToken)
    } catch (e) {
      throw e
    }
    return data
  },
  saveData: async (userId, userToken, userData) => {
    return userDataStoreClient.setData(userId, userToken, userData)
  }
}

const {loadData, saveData} = dataStoreType === 'remote' ? dataStoreRemote : dataStoreMemory

const external = {}
external.getInstanceByPropertyValue = getInstanceByPropertyValue
external.getInstanceProperty = getInstanceProperty

const removeNullEntries = (obj) => {
  Object.keys(obj).forEach(key => {
    let objProp = obj[key]
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

external.getUserDataMethods = (data, params, additional = {}) => {
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
    return data[dataScope || scope] || {}
  }

  const getUserDataProperty = (path, def, scope) => {
    return getBracketNotationPath(getDataScope(scope), path, def)
  }

  const getUserData = (scope) => getDataScope(scope)

  const getUserParams = () => paramsData

  const getScopedUserData = (params) => {
    const data = deepClone(getUserData())
    data._scopes = deepClone(getAllData())
    // TODO: check that params is not currently used anywhere
    let userParams = Object.assign({}, getUserParams(), params)
    Object.keys(userParams).forEach(param => {
      data[`param__${param}`] = userParams[param]
    })
    data._scopes.param = userParams
    data._scopes.ENV = ENV
    return data
  }

  // const format = (value, args, options) => {
  //   const formatData = Object.assign({}, getScopedUserData(), args)
  //   return format(value, formatData, options)
  // }

  const bundle = {
    getUserId: () => userId,
    getUserToken: () => userToken,
    resetUserData: async (newUserId, newUserToken) => {
      userId = newUserId
      userToken = newUserToken
      createSessionCookie(additional.res, userId, userToken)
      const originalData = await loadData(userId, userToken, {})
      data = originalData
    },
    getScope: () => scope,
    setScope: (newScope) => {
      scope = newScope
      data[scope] = data[scope] || {}
    },
    evaluate: (condition) => evaluate(condition, getAllData(), scope, true),
    saveData: () => {
      const userData = getAllData()
      // only perform if data has changed?
      return additional.saveData(userId, userToken, userData)
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
      let count = countData[path]
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

external.loadUserData = async (req, res, next) => {
  const userId = req.getUserId()
  const userToken = req.getUserToken()
  let data = {}
  if (!req.newSession) {
    try {
      data = await loadData(userId, userToken, req.session)
    } catch (e) {
      if (e.code === 404) {
        FBLogger('Failed to load data', e)
        return res.redirect('/reset')
      }
      return next(e)
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
    try {
      await req.user.saveData()
    } catch (e) {
      next(e)
    }
  }
  next()
}

module.exports = external
