/**
 * @module route
 **/

const pathToRegexp = require('path-to-regexp')

const {getInstanceProperty} = require('../service-data/service-data')
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

const getNextPage = (_id, userData) => {
  const firstStep = getInstanceProperty(_id, 'steps', [])[0]
  if (firstStep) {
    const repeatable = getInstanceProperty(firstStep, 'repeatable')
    if (!repeatable) {
      return firstStep
    }
    // const repeatableMinimum = getInstanceProperty(firstStep, 'repeatableMinimum')
    const model = getInstanceProperty(firstStep, 'model')
    return {
      _id: firstStep,
      params: {
        [model]: 1
      }
    }
  }

  const checkCurrentPage = (currentId, userData) => {
  // Is the page a repeatable instance?
    const repeatable = getInstanceProperty(currentId, 'repeatable')
    if (repeatable) {
      if (checkPageRepeatability(currentId, userData)) {
        return currentId
      }
    }
    // Is the page a step of another page?
    const parentId = getInstanceProperty(currentId, '_parent')
    if (parentId) {
      const parentSteps = getInstanceProperty(parentId, 'steps')
      const parentStepIndex = parentSteps.indexOf(currentId)
      if (parentStepIndex < parentSteps.length - 1) {
      // Does the parent page have any further steps?
        const nextStep = parentSteps[parentStepIndex + 1]
        return nextStep
      } else {
      // No - iterate with the parent page
        return checkCurrentPage(parentId, userData)
      }
    } else {
    // We've hit a wall - last page
      return undefined
    }
  }
  const nextPageId = checkCurrentPage(_id, userData)
  if (checkPageVisibility(nextPageId, userData)) {
    return nextPageId
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

const getPreviousPage = (_id, userData) => {
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
