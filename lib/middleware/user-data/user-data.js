const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const {getInstanceByPropertyValue, getInstanceProperty} = require('../../service-data/service-data')

const getData = (session) => {
  // DynamoDB code to go here
  return session
}

const external = {}
external.getInstanceByPropertyValue = getInstanceByPropertyValue
external.getInstanceProperty = getInstanceProperty

external.getUserDataMethods = (session) => {
  const allData = getData(session)
  const inputData = allData.input
  const countData = allData.count
  let paramsData = allData.params

  return {
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

external.loadUserData = (req, res, next) => {
  req.session.input = req.session.input || {}
  req.session.count = req.session.count || {}
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: external.getUserDataMethods(Object.assign({params: req.params || {}}, req.session))
  })
  Object.freeze(req.user)
  next()
}

external.saveUserData = (req, res, next) => {
  // DynamoDB code to go here
  next()
}

module.exports = external
