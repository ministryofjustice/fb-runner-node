const {FBError} = require('@ministryofjustice/fb-utils-node')
const CONSTANTS = require('../../constants/constants')
const {
  SERVICE_TOKEN,
  USER_DATASTORE_URL
} = CONSTANTS

class FBUserDataError extends FBError {}

let dataStoreType = 'memory'

if (SERVICE_TOKEN || USER_DATASTORE_URL) {
  if (!SERVICE_TOKEN) {
    throw new FBUserDataError({
      code: 'ENOSERVICETOKEN',
      message: 'No service token provided though user datastore url was set'
    })
  }
  if (!USER_DATASTORE_URL) {
    throw new FBUserDataError({
      code: 'ENOUSERDATASTOREURL',
      message: 'No user datastore url provided though service token was set'
    })
  }
  dataStoreType = 'remote'
}

const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const external = {}
external.getInstanceByPropertyValue = getInstanceByPropertyValue
external.getInstanceProperty = getInstanceProperty

external.getUserDataMethods = (data, saveData) => {
  const inputData = data.input
  const countData = data.count
  let paramsData = data.params

  return {
    saveData,
    getAllData: () => {
      return {
        input: inputData,
        count: countData
      }
    },
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
  loadData: async (session) => {
    // console.log('LOAD FROM MEMORY')
    return Promise.resolve(session)
  },
  saveData: async (session) => {
    // console.log('SAVE TO MEMORY')
  }
}

const dataStoreRemote = {
  loadData: async (session) => {
    // console.log('LOAD REMOTELY')
    return Promise.resolve(session)
  },
  saveData: async (session) => {
    // console.log('SAVE REMOTELY')
  }
}

const {loadData, saveData} = dataStoreType === 'remote' ? dataStoreRemote : dataStoreMemory

external.loadUserData = async (req, res, next) => {
  const data = await loadData(req.session)
  // console.log(req.originalUrl, JSON.stringify(req.session, null, 2))
  // if (!req.session.userId) {
  //   req.session.cookie.userId = `corBlimey${Math.random()}`
  // }
  // console.log(req.cookies)
  // get userId
  // create userId if none
  data.input = data.input || {}
  data.count = data.count || {}
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(Object.assign({params: req.params || {}}, data), saveData)
  })
  Object.freeze(req.user)
  next()
}

// external.saveUserData = (req, res, next) => {
//   saveData()
//   // DynamoDB code to go here
//   next()
// }

module.exports = external
