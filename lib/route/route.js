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
    // console.log(e)
    let brokenUrl = getInstanceProperty(route, 'url')
    return brokenUrl.replace(/:[^/]+/g, '1')
    // return '/broken'
  }
}

const checkPageVisibility = (_id, userData) => {
  // let repeatabilityCheck = checkPageRepeatability(_id, userData)
  // if (!repeatabilityCheck) {
  //   return false
  // }
  let show = getInstanceProperty(_id, 'show', true)
  if (show !== true) {
    show = evaluate(show, userData.getAllData())
  }
  return show
}
const checkPageRepeatability = (_id, userData) => {
  // const $models = getInstanceProperty(_id, '$models')
  // console.log({$models})
  // console.log('getUserCount', userData.getUserCount())
  // console.log('getUserParams', userData.getUserParams())
}
const getUrlData = (_id, userData) => {
  let params = {}
  if (typeof _id === 'object') {
    params = _id.params
    _id = _id._id
  }
  return {
    _id,
    params: Object.assign({}, userData.getUserParams(), params)
  }
  // const pageModels = getInstanceProperty(_id, '$models') || []
  // // console.log('namePrefix', getInstanceProperty(_id, 'namePrefix'))
  // const urlData = {} // Object.assign({}, req.params)
  // pageModels.forEach((model, index) => {
  //   // let namePrefixLookup = pageModels[0]
  //   // const modelsInPlay = pageModels.slice(1, index + 1)
  //   // modelsInPlay.forEach(model => {
  //   //   namePrefixLookup += `[${model}]`
  //   // })
  //   // const reffedPage = getInstanceByPropertyValue('namePrefix', namePrefixLookup)
  //   // let minimumModelValue
  //   // if (reffedPage) {
  //   //   minimumModelValue = getInstanceProperty(reffedPage._id, 'repeatableMinimum')
  //   // }
  //   // minimumModelValue = minimumModelValue || 1
  //   // console.log({namePrefixLookup, minimumModelValue})
  //   if (!urlData[model]) {
  //     urlData[model] = 10
  //   }
  // })
  // return urlData
}

const getNextUrl = (_id, userData) => {
  const nextpage = getNextPage(_id, userData)
  if (nextpage) {
    const {_id, params} = getUrlData(nextpage, userData)
    return userData.pagesMethods.getUrl(_id, params)
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
  // count or repeatableMinimum
  //  if count > 0 && param less than count (and repeatableMaximum), add 1
  console.log(params)
  const countLookup = getRepeatableCountLookup(_id, params)
  console.log(countLookup)
  let currentCount = userData.getUserCountProperty(countLookup) || repeatableMinimum
  if (currentCount === undefined) {
    currentCount = 1
  }
  return currentCount
}

const checkNextRepeatable = (_id, params, userData) => {
  const model = getInstanceProperty(_id, 'model')
  // const repeatableMaximum = getInstanceProperty(nextStep, 'repeatableMaximum')
  if (!params) {
    params = {}
  }
  if (params[model] === undefined) {
    params[model] = 0
  }
  let currentCount = getRepeatableCount(_id, params, userData)
  console.log(currentCount)
  if (params[model] < currentCount) {
    const newParams = Object.assign(deepClone(params), {[model]: params[model] + 1})
    return {_id: _id, params: newParams}
  }
}

const checkCurrentPage = (input, userData) => {
  let {_id, params} = typeof input === 'string' ? {_id: input} : input

  console.log({_id, params})
  // const firstStep = getInstanceProperty(currentId, 'steps', [])[0]
  // if (firstStep) {
  //   return firstStep
  // }
  // Is the page a repeatable instance?
  const repeatable = getInstanceProperty(_id, 'repeatable')
  if (repeatable) {
    const nextRepeatable = checkNextRepeatable(_id, params, userData)
    if (nextRepeatable) {
      return nextRepeatable
    }
    // console.log({repeatable})
    // let currentCount = getRepeatableCount(_id, params, userData)
    // const model = getInstanceProperty(_id, 'model')
    // // const repeatableMaximum = getInstanceProperty(_id, 'repeatableMaximum')
    // if (params[model] && params[model] < currentCount) {
    //   const newParams = Object.assign(deepClone(params), {[model]: params[model] + 1})
    //   return {_id, params: newParams}
    // }
    // // if count < repeatable maximum
    // //  add 1 to param and return
    // if (checkPageRepeatability(_id, userData)) {
    //   return _id
    // }
  }
  // Is the page a step of another page?
  const parentId = getInstanceProperty(_id, '_parent')
  if (parentId) {
    const repeatable = getInstanceProperty(parentId, 'repeatable')
    if (repeatable) {
      const nextRepeatable = checkNextRepeatable(parentId, params, userData)
      if (nextRepeatable) {
        return nextRepeatable
      }
      // // console.log({repeatable})
      // let currentCount = getRepeatableCount(parentId, params, userData)
      // const model = getInstanceProperty(parentId, 'model')
      // // const repeatableMaximum = getInstanceProperty(parentId, 'repeatableMaximum')
      // if (params[model] && params[model] < currentCount) {
      //   const newParams = Object.assign(deepClone(params), {[model]: params[model] + 1})
      //   return {_id: parentId, params: newParams}
      // }
    }
    console.log({parentId})
    const parentSteps = getInstanceProperty(parentId, 'steps')
    const parentStepIndex = parentSteps.indexOf(_id)
    if (parentStepIndex < parentSteps.length - 1) {
    // Does the parent page have any further steps?
      const nextStep = parentSteps[parentStepIndex + 1]
      const repeatable = getInstanceProperty(nextStep, 'repeatable')
      if (repeatable) {
        const nextRepeatable = checkNextRepeatable(nextStep, params, userData)
        if (nextRepeatable) {
          return nextRepeatable
        }
        // // console.log({repeatable})
        // const model = getInstanceProperty(nextStep, 'model')
        // // const repeatableMaximum = getInstanceProperty(nextStep, 'repeatableMaximum')
        // if (!params) {
        //   params = {}
        // }
        // if (params[model] === undefined) {
        //   params[model] = 0
        // }
        // let currentCount = getRepeatableCount(nextStep, params, userData)
        // console.log(currentCount)
        // if (params[model] < currentCount) {
        //   const newParams = Object.assign(deepClone(params), {[model]: params[model] + 1})
        //   return {_id: nextStep, params: newParams}
        // }
      }
      // doMeRepeats(nextStep, userData)
      // console.log({nextStep})
      return nextStep
    } else {
    // No - iterate with the parent page
      return checkCurrentPage({_id: parentId, params}, userData)
    }
  } else {
  // We've hit a wall - last page
    return undefined
  }
}

const getNextPage = (input, userData) => {
  const {_id, params} = typeof input === 'string' ? {_id: input} : input
  // const $models = getInstanceProperty(_id, '$models')
  // console.log({_id, $models})

  // NO NO NO - must check all the steps since they could be hidden or 0-based repeatables
  const steps = getInstanceProperty(_id, 'steps', [])
  if (steps[0]) {
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index]
      // if it's a repeatable check minimum
      //   next if 0s
      //   else add param set to 1
      // pass on same params
      if (checkPageVisibility(step, userData)) {
        return {_id: step}
      }
    }
  }
  // if (firstStep) {
  //   const repeatable = getInstanceProperty(firstStep, 'repeatable')
  //   if (!repeatable) {
  //     if (checkPageRepeatability(firstStep, userData)) {
  //       return {_id: firstStep}
  //     } else {
  //       return
  //     }
  //   }
  //   // const repeatableMinimum = getInstanceProperty(firstStep, 'repeatableMinimum')
  //   const model = getInstanceProperty(firstStep, 'model')
  //   return {
  //     _id: firstStep,
  //     params: {
  //       [model]: 1
  //     }
  //   }
  // }

  const nextPageId = checkCurrentPage(input, userData)
  if (!nextPageId) {
    return
  }
  if (checkPageVisibility(nextPageId._id || nextPageId, userData)) {
    return nextPageId._id ? nextPageId : {_id: nextPageId}
  } else {
    return getNextPage(nextPageId, userData)
  }
}

const getPreviousUrl = (_id, userData) => {
  const previouspage = getPreviousPage(_id, userData)
  if (previouspage) {
    return userData.pagesMethods.getUrl(previouspage, getUrlData(previouspage, userData))
  }
}

const getPreviousPage = (input, userData) => {
  const {_id, params} = typeof input === 'string' ? {_id: input} : input
  const checkCurrentPage = (currentId, userData) => {
    // Is the page a repeatable instance?
    const repeatable = getInstanceProperty(currentId, 'repeatable', {})
    if (repeatable.active) {
      if (checkPageVisibility(currentId, userData)) {
        return currentId
      }
    }
    // Is the page a step of another page?
    const parentId = getInstanceProperty(currentId, '_parent')
    if (parentId) {
      const parentSteps = getInstanceProperty(parentId, 'steps')
      const parentStepIndex = parentSteps.indexOf(currentId)
      if (parentStepIndex > 0) {
      // Does the parent page have any further steps?
        const previousStep = parentSteps[parentStepIndex - 1]
        const siblingSteps = getInstanceProperty(previousStep, 'steps', [])
        const lastSiblingStep = siblingSteps[siblingSteps.length - 1]
        if (lastSiblingStep) {
          return lastSiblingStep
        }
        return previousStep
      } else {
        return parentId
      }
    } else {
      // We've hit the entry point
      return undefined
    }
  }
  const previousPageId = checkCurrentPage(_id, userData)
  if (checkPageVisibility(previousPageId, userData)) {
    return previousPageId
  } else {
    return getPreviousPage(previousPageId, userData)
  }
}

module.exports = {
  init,
  getRouteData,
  getRouteUrl,
  getNextUrl,
  getNextPage,
  getPreviousUrl,
  getPreviousPage
}
