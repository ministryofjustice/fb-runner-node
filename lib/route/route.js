/**
 * @module route
 **/

const pathToRegexp = require('path-to-regexp')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {
  getInstance,
  getInstanceProperty
} = require('../service-data/service-data')
const {evaluate} = require('../evaluate-condition/evaluate-condition')

const init = (instances, baseUrl = '') => {
  let pageMethods
  let routeParamsCache
  const getData = (url) => {
    if (routeParamsCache[url]) {
      return routeParamsCache[url]
    }
    const routeParams = getRouteData(pageMethods, url)
    routeParamsCache[url] = routeParams
    return routeParams
  }
  const getUrl = (route, params) => {
    const url = getRouteUrl(pageMethods, route, params)
    return url ? `${baseUrl}${url}` : url
  }
  const updatePageMethods = (instances) => {
    routeParamsCache = {}
    pageMethods = createPageMethods(instances)
  }
  updatePageMethods(instances)
  return {
    getData,
    getUrl,
    updatePageMethods
  }
}

const createPageMethods = (instances) => {
  // let pages = Object.keys(instances).filter(instance => instance.category.indexOf('page'))
  let pageMethods = Object.keys(instances).sort().map(instanceId => {
    const page = instances[instanceId]
    // should look for presence of a preceding slash too
    // page.url = page.url || `/${instanceId}`

    let regex = page.url.replace(/:([^/]+)/g, (m, m1) => {
      let keyName = m1
      let keyMatch = '[^/]+'
      let optional = ''
      let extra = ''
      if (keyName.endsWith('*')) {
        keyName = keyName.substr(0, keyName.length - 1)
        keyMatch = '.+'
      } else if (keyName.endsWith('?')) {
        keyName = keyName.substr(0, keyName.length - 1)
        optional = '?'
      } else if (keyName.endsWith('+')) {
        keyName = keyName.substr(0, keyName.length - 1)
        optional = '{1,}'
      }
      if (keyName.match(/^[a-z]+\(.+\)/)) {
        keyName = keyName.replace(/^([a-z]+)\((.+)\)(.*)/, (m, m1, m2, m3) => {
          keyMatch = m2
          extra = m3
          return m1
        })
      }
      // if (keyName.replace(/[a-z0-9]/g, '') !== keyName)
      let greedyMatch = ''
      // greedyMatch = '?'
      return `(?<${keyName}>${keyMatch}${greedyMatch})${extra}${optional}`
    })
    regex = regex.replace(/(\/\(\?([^)]+\)))\?/g, '($1)?')
    regex = `^${regex}$`

    const route = page._id
    const getUrl = pathToRegexp.compile(page.url)
    const url = page.url
    return {
      route,
      regex,
      getUrl,
      url
    }
  })
  pageMethods = pageMethods.sort((a, b) => {
    let aRegex = a.regex.toString()
    let bRegex = b.regex.toString()
    return aRegex > bRegex ? -1 : 1
  })
  return pageMethods
}

const getRouteData = (pagesMethods, url) => {
  for (let i = 0; i < pagesMethods.length; i++) {
    const pageMethod = pagesMethods[i]
    const match = url.match(pageMethod.regex)
    if (match) {
      const matchData = {
        route: pageMethod.route
      }
      if (match.groups) {
        matchData.params = match.groups
      }
      return matchData
    }
  }
  if (url.endsWith('/')) {
    url = url.replace(/\/$/, '')
    return getRouteData(pagesMethods, url)
  }

  return undefined
}

const getRouteUrl = (pagesMethods, route, params) => {
  const routingInfo = pagesMethods.filter(pageMethods => pageMethods.route === route)[0]
  if (!routingInfo) {
    return
  }
  const {getUrl} = routingInfo
  try {
    const url = getUrl(params, {encode: (value, token) => value})
    return url
  } catch (e) {
    let brokenUrl = getInstanceProperty(route, 'url')
    return brokenUrl.replace(/:[^/]+/g, '1')
  }
}

const checkPageVisibility = (inputPage, userData) => {
  const {_id, params} = typeof inputPage === 'string' ? {_id: inputPage} : inputPage
  let show = getInstanceProperty(_id, 'show', true)
  if (show !== true) {
    show = evaluate(show, userData.getAllData(), params)
  }
  return show
}

// const getUrlData = (_id, userData) => {
//   let params = {}
//   if (typeof _id === 'object') {
//     params = _id.params
//     _id = _id._id
//   }
//   return {
//     _id,
//     params: Object.assign({}, userData.getUserParams(), params)
//   }
// }

const getNextUrl = (input, userData) => {
  const nextpage = getNextPage(input, userData)
  if (nextpage) {
    return userData.pagesMethods.getUrl(nextpage._id, nextpage.params)
    // const {_id, params} = getUrlData(nextpage, userData)
    // return userData.pagesMethods.getUrl(_id, params)
  }
}

const getRepeatableCountLookup = (_id, params) => {
  const buildLookup = (_id) => {
    const instance = getInstance(_id)
    const model = instance.model || ''
    const param = params[model] || 1
    const repeatable = instance.repeatable ? `[${param}]` : ''
    const stringPart = `${model}${repeatable}`
    const parentPart = instance._parent ? buildLookup(instance._parent) : ''
    return `${parentPart}${parentPart ? '.' : ''}${stringPart}`
  }
  const countLookup = buildLookup(_id).replace(/\[\d+\]$/, '')
  return countLookup
}

const getRepeatableCount = (_id, params, userData) => {
  const repeatableMinimum = getInstanceProperty(_id, 'repeatableMinimum')
  const countLookup = getRepeatableCountLookup(_id, params)
  const userCountProperty = userData.getUserCountProperty(countLookup) || {}
  let currentCount = userCountProperty.current || repeatableMinimum
  if (currentCount === undefined) {
    currentCount = 1
  }
  return currentCount
}

const updateParams = (_id, params, direction) => {
  // use $models ?
  const models = []
  const buildModels = (_id) => {
    const instance = getInstance(_id)
    const model = instance.model
    const repeatable = instance.repeatable
    if (model && repeatable) {
      models.push(model)
    }
    if (instance._parent) {
      buildModels(instance._parent)
    }
  }
  buildModels(_id)

  params = params || {}
  const updatedParams = {}
  models.forEach((model, index) => {
    let paramValue = params[model]
    if (params[model] === undefined) {
      if (direction === 'next') {
        params[model] = 1
      } else if (direction === 'previous') {
        params[model] = 1000000
        // set to repeatableCount
        // need the repeatableCount then
        // if index is 0, we need to set it to repeatableCount + 1 - handle in checkPreviousRepeatable
      }
    }
    if (index === 0) {
      if (direction === 'next') {
        paramValue++
      } else if (direction === 'previous') {
        paramValue--
      }
    }
    updatedParams[model] = paramValue
  })
  return updatedParams
}

const checkNextRepeatable = (_id, params, userData) => {
  const repeatable = getInstanceProperty(_id, 'repeatable')
  if (!repeatable) {
    return
  }
  const model = getInstanceProperty(_id, 'model')

  if (!params) {
    params = {}
  }
  if (params[model] === undefined) {
    params[model] = 0
  }
  let currentCount = getRepeatableCount(_id, params, userData)
  if (params[model] < currentCount) {
    const newParams = updateParams(_id, params, 'next')
    return {_id: _id, params: newParams}
  }
}

// Not needed now getPreviousPage is running getNextPage
// const checkPreviousRepeatable = (_id, params, userData) => {
//   const repeatable = getInstanceProperty(_id, 'repeatable')
//   if (!repeatable) {
//     return
//   }
//   const model = getInstanceProperty(_id, 'model')

//   if (!params) {
//     params = {}
//   }
//   let currentCount = getRepeatableCount(_id, params, userData)
//   if (params[model] === undefined) {
//     params[model] = currentCount + 1
//   }
//   if (params[model] > 1) {
//     const newParams = updateParams(_id, params, 'previous')
//     return {_id: _id, params: newParams}
//   }
// }

const checkNextInputPage = (inputPage, userData) => {
  let {_id, params} = inputPage

  // Is the page a repeatable instance?
  const nextRepeatable = checkNextRepeatable(_id, params, userData)
  if (nextRepeatable) {
    // FOUND
    return nextRepeatable
  }

  // Is the page a step of another page?
  const parentId = getInstanceProperty(_id, '_parent')
  if (parentId) {
    // TODO: surely this should come after checking the next sibling?
    const nextRepeatable = checkNextRepeatable(parentId, params, userData)
    if (nextRepeatable) {
      // FOUND
      return nextRepeatable
    }

    const parentSteps = getInstanceProperty(parentId, 'steps')
    const parentStepIndex = parentSteps.indexOf(_id)
    if (parentStepIndex < parentSteps.length - 1) {
    // Does the parent page have any further steps?
      const nextStep = parentSteps[parentStepIndex + 1]
      const repeatable = getInstanceProperty(nextStep, 'repeatable')
      if (repeatable) {
        const nextRepeatable = checkNextRepeatable(nextStep, params, userData)
        if (nextRepeatable) {
          // FOUND
          return nextRepeatable
        }
      } else {
        // FOUND
        // Not repeatable, just an ordinary step
        const updatedParams = updateParams(nextStep, params, 'next')
        return {_id: nextStep, params: updatedParams}
      }
    } else {
      // NOT FOUND - iterate with the parent page
      return checkNextInputPage({_id: parentId, params}, userData)
    }
  } else {
    // NOT FOUND - We've hit a wall - last page
    return undefined
  }
}

const getNextPage = (inputPage, userData) => {
  inputPage = deepClone(inputPage)
  const {_id, params} = inputPage

  const show = checkPageVisibility(inputPage, userData)
  if (show) {
    const steps = getInstanceProperty(_id, 'steps', [])
    if (steps[0]) {
      for (let index = 0; index < steps.length; index++) {
        const stepId = steps[index]

        const repeatable = getInstanceProperty(stepId, 'repeatable')
        if (repeatable) {
          const nextRepeatable = checkNextRepeatable(stepId, params, userData)
          if (nextRepeatable) {
            if (checkPageVisibility(nextRepeatable, userData)) {
              // FOUND
              return nextRepeatable
            }
          }
        } else {
          const updatedParams = updateParams(stepId, params, 'next')
          const stepPage = {
            _id: stepId,
            params: updatedParams
          }
          if (checkPageVisibility(stepPage, userData)) {
          // FOUND
            return stepPage
          }
        }
      }
    }
  }

  const nextPage = checkNextInputPage(inputPage, userData)
  if (!nextPage) {
    return
  }
  if (checkPageVisibility(nextPage, userData)) {
    return nextPage
  } else {
    return getNextPage(nextPage, userData)
  }
}

const getPreviousUrl = (inputPage, userData) => {
  const previouspage = getPreviousPage(inputPage, userData)
  if (previouspage) {
    return userData.pagesMethods.getUrl(previouspage._id, previouspage.params)
    // return userData.pagesMethods.getUrl(previouspage, getUrlData(previouspage, userData))
  }
}

// checkPageIdParams is 10 times faster than stringifyCheckPageIdParams which in turn is 10 times faster than assertCheckPageIdParams
// const assert = require('assert')
// const assertCheckPageIdParams = (input, candidate) => {
//   try {
//     if (candidate.params && !Object.keys(candidate.params).length) {
//       delete candidate.params
//     }
//     assert.deepEqual(input, candidate)
//     return true
//   } catch (e) {
//     return false
//   }
// }
// const jsonKeySort = (key, value) => {
//   if (value == null || value.constructor !== Object) {
//     return value
//   }
//   return Object.keys(value).sort().reduce((s, k) => { s[k] = value[k]; return s }, {})
// }
// const stringifyCheckPageIdParams = (input, candidate) => {
//   if (!candidate) {
//     return false
//   }
//   if (input._id !== candidate._id) {
//     return false
//   }
//   return JSON.stringify(input.params || {}, jsonKeySort) === JSON.stringify(candidate.params || {}, jsonKeySort)
// }
const checkPageIdParams = (input, candidate) => {
  if (!candidate) {
    return false
  }
  if (input._id !== candidate._id) {
    return false
  }

  const inputParams = input.params || {}
  const candidateParams = candidate.params || {}
  const inputKeys = Object.keys(inputParams).sort()
  const candidateKeys = Object.keys(candidateParams).sort()
  if (inputKeys.length !== candidateKeys.length) {
    return false
  }
  for (let i = 0; i < inputKeys.length; i++) {
    if (inputParams[inputKeys[i]] !== candidateParams[inputKeys[i]]) {
      return false
    }
  }
  return true
}

const getPreviousPage = (inputPage, userData) => {
  const {_id} = inputPage
  let startPage
  let instance = getInstance(_id)
  while (instance._parent) {
    startPage = instance._parent
    instance = getInstance(instance._parent)
  }

  let candidatePage = {_id: startPage}
  while (candidatePage) {
    const candidateResultPage = getNextPage(candidatePage, userData)
    if (checkPageIdParams(inputPage, candidateResultPage)) {
      return candidatePage
    }
    candidatePage = candidateResultPage
  }
}

// const XgetPreviousPage = (input, userData) => {
//   const {_id} = typeof input === 'string' ? {_id: input} : input
//   const checkCurrentPage = (currentId, userData) => {
//     // Is the page a repeatable instance?
//     const repeatable = getInstanceProperty(currentId, 'repeatable', {})
//     if (repeatable.active) {
//       if (checkPageVisibility(currentId, userData)) {
//         return currentId
//       }
//     }
//     // Is the page a step of another page?
//     const parentId = getInstanceProperty(currentId, '_parent')
//     if (parentId) {
//       const parentSteps = getInstanceProperty(parentId, 'steps')
//       const parentStepIndex = parentSteps.indexOf(currentId)
//       if (parentStepIndex > 0) {
//       // Does the parent page have any further steps?
//         const previousStep = parentSteps[parentStepIndex - 1]
//         const siblingSteps = getInstanceProperty(previousStep, 'steps', [])
//         const lastSiblingStep = siblingSteps[siblingSteps.length - 1]
//         if (lastSiblingStep) {
//           return lastSiblingStep
//         }
//         return previousStep
//       } else {
//         return parentId
//       }
//     } else {
//       // We've hit the entry point
//       return undefined
//     }
//   }
//   const previousPageId = checkCurrentPage(_id, userData)
//   if (checkPageVisibility(previousPageId, userData)) {
//     return previousPageId
//   } else {
//     return getPreviousPage(previousPageId, userData)
//   }
// }

module.exports = {
  init,
  getRouteData,
  getRouteUrl,
  getNextUrl,
  getNextPage,
  getPreviousUrl,
  getPreviousPage,
  checkPageIdParams
}
