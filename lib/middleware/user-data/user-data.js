const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {FBLogger, deepClone} = require('@ministryofjustice/fb-utils-node')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const userDataStoreClient = require('../../client/user-datastore/user-datastore')

/* eslint-disable no-unused-vars */
const {createSessionCookie} = require('../user-session/user-session')
/* eslint-enable no-unused-vars */

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

external.getUserDataMethods = (data, saveData) => {
  let context = 'input'
  data.input = data.input || {}
  data.count = data.count || {}
  data.flash = data.flash || []

  const countData = data.count
  let paramsData = data.params
  const flashMessages = data.flash
  const successfulUploads = {}

  let bodyInput

  const getAllData = () => {
    const allData = {}
    Object.keys(data).forEach(key => {
      if (key === 'params' || key === 'res' || key === 'req') {
        return
      }
      if (typeof data[key] !== 'function') {
        allData[key] = data[key]
      }
    })
    return allData
  }
  data.getAllData = getAllData

  const getDataContext = (dataContext) => {
    return data[dataContext || context] || {}
  }

  const getUserDataProperty = (path, def, context) => {
    return getBracketNotationPath(getDataContext(context), path, def)
  }

  return {
    resetUserData: async (userId, userToken) => {
      // console.log('createSessionCookie', typeof createSessionCookie)
      // console.log('data.res', typeof data.res)
      // console.log('data.req', typeof data.req)
      // console.log({userId, userToken})
      // // createSessionCookie(data.res, userId, userToken)
      // const originalData = await loadData(userId, userToken, {})
      // console.log({originalData})
    },
    setContext: (newContext) => {
      context = newContext
      data[context] = data[context] || {}
    },
    saveData: () => {
      const userId = data.getUserId()
      const userToken = data.getUserToken()
      const userData = data.getAllData()
      // FBLogger({userData})
      return saveData(userId, userToken, userData)
    },
    getAllData,
    getUserDataProperty,
    getUserData: (context) => getDataContext(context),
    getUserDataInput: () => data.input,
    getUserDataInputProperty: (path, def) => getUserDataProperty(path, def, 'input'),
    getOutputData: (context) => {
      let output = deepClone(getDataContext(context))
      delete output.COMPOSITE
      output = removeNullEntries(output)
      return output
    },
    setUserDataProperty: (path, value, context) => setBracketNotationPath(getDataContext(context), path, value),
    setUserData: (updatedData, context) => Object.assign(getDataContext(context), updatedData),
    unsetUserDataProperty: (path, context) => unsetBracketNotationPath(getDataContext(context), path),
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
    getUserParams: () => paramsData,
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

  // data.userId = userId
  // data.userToken = userToken

  // data.input = data.input || {}
  // data.count = data.count || {}
  // data.flash = data.flash || []
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(Object.assign({
      params: req.params || {}
    }, {
      req,
      res,
      getUserId: req.getUserId,
      getUserToken: req.getUserToken
    },
    data), saveData)
  })
  // these lines should not be necessary given the defineProperty call above
  // but some controllers (eg return.setup.email.check end up with
  // a userData that has not getUserId method)
  req.user.getUserId = req.getUserId
  req.user.getUserToken = req.getUserToken
  // delete req.getUserId
  // delete req.getUserToken
  req.user.req = req
  req.user.res = res

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
