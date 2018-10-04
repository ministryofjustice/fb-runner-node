const userDataStoreClient = require('@ministryofjustice/fb-user-datastore-client-node')

const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const {USER_DATASTORE_URL, SERVICE_TOKEN, SERVICE_SLUG} = require('../../constants/constants')

// initialise user datastore client
userDataStoreClient.init(SERVICE_SLUG, SERVICE_TOKEN, USER_DATASTORE_URL)

const dataStoreType = USER_DATASTORE_URL ? 'remote' : 'memory'

const external = {}
external.getInstanceByPropertyValue = getInstanceByPropertyValue
external.getInstanceProperty = getInstanceProperty

external.getUserDataMethods = (data, saveData) => {
  data.input = data.input || {}
  data.count = data.count || {}
  const inputData = data.input
  const countData = data.count
  let paramsData = data.params

  const getAllData = () => {
    return {
      input: inputData,
      count: countData
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
    return userDataStoreClient.get(userId, userToken)
  },
  saveData: async (userId, userToken, userData) => {
    return userDataStoreClient.set(userId, userToken, userData)
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
      next(e)
    }
  }

  data.userId = userId
  data.userToken = userToken

  data.input = data.input || {}
  data.count = data.count || {}
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(Object.assign({params: req.params || {}}, data), saveData)
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
