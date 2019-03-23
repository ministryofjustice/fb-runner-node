const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {FBLogger, deepClone} = require('@ministryofjustice/fb-utils-node')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const userDataStoreClient = require('../../client/user-datastore/user-datastore')

const dataStoreType = userDataStoreClient ? 'remote' : 'memory'

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
  data.input = data.input || {}
  data.count = data.count || {}
  data.flash = data.flash || []
  const inputData = data.input
  const countData = data.count
  let paramsData = data.params
  const flashMessages = data.flash
  const successfulUploads = {}

  let bodyInput

  const getAllData = () => {
    return {
      input: inputData,
      count: countData,
      flash: flashMessages
    }
  }
  data.getAllData = getAllData

  return {
    saveData: () => {
      const {userId, userToken} = data
      const userData = data.getAllData()
      return saveData(userId, userToken, userData)
    },
    getAllData,
    getUserDataProperty: (path, def) => getBracketNotationPath(inputData, path, def),
    getUserData: () => inputData,
    getOutputData: () => {
      let output = deepClone(inputData)
      delete output.COMPOSITE
      output = removeNullEntries(output)
      return output
    },
    setUserDataProperty: (path, value) => setBracketNotationPath(inputData, path, value),
    setUserData: (data) => Object.assign(inputData, data),
    unsetUserDataProperty: (path) => unsetBracketNotationPath(inputData, path),
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

external.loadUserData = async (req, res, next) => {
  const {userId, userToken} = req.session
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

  data.userId = userId
  data.userToken = userToken

  data.input = data.input || {}
  data.count = data.count || {}
  data.flash = data.flash || []
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(Object.assign({params: req.params || {}}, data), saveData)
  })
  req.user.userId = userId
  req.user.userToken = userToken
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
