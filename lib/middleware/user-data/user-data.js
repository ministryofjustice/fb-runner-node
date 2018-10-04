const {USER_DATASTORE_URL} = require('../../constants/constants')

const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

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

  return {
    saveData: () => {
      // const dataOut = getAllData()
      saveData()
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

  data.input = data.input || {}
  data.count = data.count || {}
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(Object.assign({params: req.params || {}}, data), saveData)
  })
  Object.freeze(req.user)
  next()
}

module.exports = external
