require('@ministryofjustice/module-alias/register-module')(module)

/**
 * @module route
 */

const pathToRegexp = require('path-to-regexp')
const cloneDeep = require('lodash.clonedeep')

const { FQD, PORT } = require('~/fb-runner-node/constants/constants')
const SERVER_ADDRESS = FQD ? FQD.replace(/\/$/, '') : `http://localhost:${PORT}`

const {
  getEntryPointInstances,
  getInstance,
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

const internal = {}

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

  const getUrl = (route, params, lang) => {
    if (route.includes('/')) {
      return route
    }

    const url = getRouteUrl(pageMethods, route, params, lang)

    return url ? baseUrl.concat(url) : url
  }

  const updatePageMethods = (instances) => {
    routeParamsCache = {}
    pageMethods = createPageMethods(instances)
  }
  updatePageMethods(instances)
  internal.getUrl = getUrl
  internal.getData = getData
  return {
    getData,
    getUrl,
    updatePageMethods
  }
}

const getRedirectUrl = (url, changePage) => changePage ? url.concat('/change').concat(changePage) : url

const getData = (url) => internal.getData(url)
const getUrl = (route, params, lang) => internal.getUrl(route, params, lang)
const hasUrl = (...args) => !!getUrl(...args)

const getFullyQualifiedUrl = (url = '') => SERVER_ADDRESS + url

const createRouteRegex = (url) => {
  let regex = url.replace(/:([^/]+)/g, (m, m1) => {
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
    const greedyMatch = ''
    // greedyMatch = '?'
    return `(?<${keyName}>${keyMatch}${greedyMatch})${extra}${optional}`
  })
  regex = regex.replace(/(\/\(\?([^)]+\)))\?/g, '($1)?')
  regex = `^${regex}$`
  return regex
}

const createPageMethods = (instances) => {
  // let pages = Object.keys(instances).filter(instance => instance.category.indexOf('page'))
  let pageMethods = Object.keys(instances).sort().map(instanceId => {
    const page = instances[instanceId]
    // should look for presence of a preceding slash too
    // page.url = page.url || `/${instanceId}`

    const regex = createRouteRegex(page.url)
    let langRegexes

    const route = page._id

    const compiledUrl = pathToRegexp.compile(page.url)
    const compiledLangUrls = {}
    const langUrlKeys = Object.keys(page).filter(key => key.startsWith('url:'))
    langUrlKeys.forEach(urlKey => {
      const lang = urlKey.replace(/^url:/, '')
      compiledLangUrls[lang] = pathToRegexp.compile(page[urlKey])
      langRegexes = langRegexes || {}
      langRegexes[lang] = createRouteRegex(page[urlKey])
    })
    const getUrl = (params, lang, options = { encode: (value, token) => value }) => {
      const urlMethod = lang ? compiledLangUrls[lang] : compiledUrl
      return urlMethod(params, options)
    }
    const url = page.url
    return {
      route,
      regex,
      langRegexes,
      getUrl,
      url
    }
  })
  pageMethods = pageMethods.sort((a, b) => {
    const aRegex = a.regex.toString()
    const bRegex = b.regex.toString()
    return aRegex > bRegex ? -1 : 1
  })
  return pageMethods
}

const getRouteData = (pageMethods, url) => {
  for (let i = 0; i < pageMethods.length; i++) {
    const pageMethod = pageMethods[i]
    let lang
    let match = url.match(pageMethod.regex)
    if (!match && pageMethod.langRegexes) {
      const regexes = pageMethod.langRegexes
      Object.keys(regexes).forEach(regexLang => {
        if (!match) {
          match = url.match(regexes[regexLang])
          if (match) {
            lang = regexLang
          }
        }
      })
    }
    if (match) {
      const matchData = {
        route: pageMethod.route
      }
      if (lang) {
        matchData.lang = lang
      }
      if (match.groups) {
        matchData.params = match.groups
      }
      return matchData
    }
  }
  if (url.endsWith('/')) {
    url = url.replace(/\/$/, '')
    return getRouteData(pageMethods, url)
  }

  return undefined
}

const getRouteUrl = (pageMethods, route, params, lang) => {
  const routingInfo = pageMethods.filter(pageMethods => pageMethods.route === route)[0]
  if (!routingInfo) {
    return
  }
  const { getUrl } = routingInfo
  try {
    const url = getUrl(params, lang)
    return url
  } catch (e) {
    const brokenUrl = getInstanceProperty(route, 'url')
    return brokenUrl ? brokenUrl.replace(/:[^/]+/g, '1') : ''
  }
}

const checkPageVisibility = (currentPage, userData) => {
  const { _id } = typeof currentPage === 'string' ? { _id: currentPage } : currentPage

  if (getInstanceProperty(_id, '_type') === 'page.confirmation') {
    return true
  }

  let show = getInstanceProperty(_id, 'show', true)
  if (show !== true) {
    const page = getInstance(_id)
    show = userData.evaluate(show, {
      page,
      instance: page
    })
  }

  return show
}

function getNextUrl (currentPage, userData) {
  const nextPage = getNextPage(currentPage, userData)

  if (nextPage) {
    const {
      _id,
      params
    } = nextPage

    return getUrl(_id, params, userData.contentLang)
  }
}

const getRepeatableCountLookup = (_id, params) => {
  const buildLookup = (_id) => {
    const instance = getInstance(_id)
    const namespace = instance.namespace || ''
    const param = params[namespace] || 1
    const repeatable = instance.repeatable ? `[${param}]` : ''
    const stringPart = `${namespace}${repeatable}`
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
  // use $namespaces ?
  const namespaces = []
  const buildNamespaces = (_id) => {
    const instance = getInstance(_id)
    const namespace = instance.namespace
    const repeatable = instance.repeatable
    if (namespace && repeatable) {
      namespaces.push(namespace)
    }
    if (instance._parent) {
      buildNamespaces(instance._parent)
    }
  }
  buildNamespaces(_id)

  params = params || {}
  const updatedParams = {}
  namespaces.forEach((namespace, index) => {
    let paramValue = params[namespace]
    if (params[namespace] === undefined) {
      if (direction === 'next') {
        params[namespace] = 1
      } else if (direction === 'previous') {
        params[namespace] = 1000000
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
    updatedParams[namespace] = paramValue
  })
  return updatedParams
}

const checkNextRepeatable = (_id, params, userData) => {
  const repeatable = getInstanceProperty(_id, 'repeatable')
  if (!repeatable) {
    return
  }
  const namespace = getInstanceProperty(_id, 'namespace')

  if (!params) {
    params = {}
  }
  if (params[namespace] === undefined) {
    params[namespace] = 0
  }
  const currentCount = getRepeatableCount(_id, params, userData)
  if (params[namespace] < currentCount) {
    const newParams = updateParams(_id, params, 'next')
    return { _id: _id, params: newParams }
  }
}

const checkNextInputPage = ({ _id, params }, userData) => {
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
        return { _id: nextStep, params: updatedParams }
      }
    } else {
      // NOT FOUND - iterate with the parent page
      return checkNextInputPage({ _id: parentId, params }, userData)
    }
  } else {
    // NOT FOUND - We've hit a wall - last page
    return undefined
  }
}

const getNextPage = (currentPage, userData, recurse) => {
  currentPage = cloneDeep(currentPage)
  const { _id, params } = currentPage
  const show = checkPageVisibility(currentPage, userData)
  if (show) {
    if (!recurse) {
      const explicitNextPage = getInstanceProperty(_id, 'nextPage', [])
      for (let index = 0; index < explicitNextPage.length; index++) {
        let nextPage = explicitNextPage[index]
        // params stuff here is very, very ropey - ie. it just ignores it
        if (typeof nextPage === 'object') {
          if (nextPage.condition !== true) {
            const page = getInstance(_id)
            nextPage = userData.evaluate(nextPage.condition, {
              page,
              instance: page
            }) ? nextPage.page : undefined
          }
        }
        if (typeof nextPage === 'string') {
          return {
            _id: nextPage,
            params: {}
          }
        }
      }
    }
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

  const nextPage = checkNextInputPage(currentPage, userData)
  if (!nextPage) {
    return
  }

  if (checkPageVisibility(nextPage, userData)) {
    return nextPage
  } else {
    return getNextPage(nextPage, userData)
  }
}

function getPreviousUrl (currentPage, userData) {
  const previousPage = getPreviousPage(currentPage, userData)
  if (previousPage) {
    const {
      _id,
      params
    } = previousPage

    return getUrl(_id, params, userData.contentLang)
  }
}

const checkPageIdParams = (alpha, omega) => {
  if (!omega) {
    return false
  }

  if (alpha._id !== omega._id) {
    return false
  }

  const alphaParams = alpha.params || {}
  const omegaParams = omega.params || {}
  const alphaParamsKeys = Object.keys(alphaParams).sort()
  const omegaParamsKeys = Object.keys(omegaParams).sort()

  if (alphaParamsKeys.length !== omegaParamsKeys.length) {
    return false
  }

  for (let i = 0; i < alphaParamsKeys.length; i++) {
    let alphaValue = alphaParams[alphaParamsKeys[i]]
    let omegaValue = omegaParams[alphaParamsKeys[i]]

    if (Number.isInteger(alphaValue)) {
      alphaValue = alphaValue.toString()
    }

    if (Number.isInteger(omegaValue)) {
      omegaValue = omegaValue.toString()
    }

    if (alphaValue !== omegaValue) {
      return false
    }
  }

  return true
}

const getPreviousPage = (currentPage, userData) => {
  const { _id } = currentPage
  let startPage
  let instance = getInstance(_id)
  while (instance._parent) {
    startPage = instance._parent
    instance = getInstance(instance._parent)
  }

  let candidatePage = { _id: startPage }
  while (candidatePage) {
    const candidateResultPage = getNextPage(candidatePage, userData, true)

    if (checkPageIdParams(currentPage, candidateResultPage)) {
      return candidatePage
    }

    candidatePage = candidateResultPage
  }
}

let pagesMethods = {}
const getPagesMethods = () => {
  return pagesMethods
}

let navigation = {}

const getNavigationPages = () => navigation
const getNavigation = (page) => page ? navigation[page] : navigation

const setNavigation = (_id, entrypage) => {
  let nextpage
  let previouspage
  const navPage = getInstance(_id)
  const steps = navPage.steps || []
  if (steps[0]) {
    nextpage = steps[0]
  }

  const parent = getInstance(navPage._parent)
  if (parent) {
    const stepIndex = parent.steps.indexOf(_id)
    if (stepIndex) {
      let previous = parent.steps[stepIndex - 1]
      while (getInstanceProperty(previous, 'steps')) {
        const previousSteps = getInstanceProperty(previous, 'steps')
        previous = previousSteps[previousSteps.length - 1]
      }
      previouspage = previous

      if (stepIndex < parent.steps.length - 1) {
        nextpage = nextpage || parent.steps[stepIndex + 1]
      } else {
        const checkGrandParent = (parent) => {
          const grandparent = getInstance(parent._parent)
          if (grandparent) {
            const grandParentStepIndex = grandparent.steps.indexOf(parent._id)
            if (grandParentStepIndex < grandparent.steps.length - 1) {
              nextpage = nextpage || grandparent.steps[grandParentStepIndex + 1]
            } else {
              checkGrandParent(grandparent)
            }
          }
        }
        checkGrandParent(parent)
      }
    } else {
      nextpage = nextpage || parent.steps[1]
      if (!nextpage) {
        const getNextFromParent = (parentId) => {
          const parent = getInstance(parentId)
          let nextpage
          const grandparent = getInstance(parent._parent)
          if (grandparent) {
            const grandParentStepIndex = grandparent.steps.indexOf(parent._id)
            if (grandParentStepIndex < grandparent.steps.length - 1) {
              nextpage = grandparent.steps[grandParentStepIndex + 1]
            } else {
              nextpage = getNextFromParent(grandparent._id)
            }
          }
          return nextpage
        }
        nextpage = getNextFromParent(parent._id)
      }
      previouspage = parent._id
    }
  }

  navigation[_id] = {
    nextpage,
    previouspage,
    entrypage
  }

  steps.forEach((step, index) => {
    setNavigation(step, entrypage || _id)
  })
}

const initRoutes = (pages) => {
  // initialise route url matching and creation methods
  pagesMethods = init(pages)

  // temporary next and previous page handling
  // TODO: implement proper next page method
  navigation = {}

  const entryIds = getEntryPointInstances()
    .filter(instance => instance._type !== 'page.error')
    .sort((a, b) => a.url > b.url ? 1 : -1)
    .map(instance => instance._id)

  entryIds.forEach(entryId => setNavigation(entryId))

  // serviceDataTimestamp = getTimestamp()
}

module.exports = {
  init,
  getRedirectUrl,
  getUrl,
  hasUrl,
  getFullyQualifiedUrl,
  getData,
  getRouteData,
  getRouteUrl,
  getNextUrl,
  getNextPage,
  getPreviousUrl,
  getPreviousPage,
  checkPageIdParams,
  initRoutes,
  getPagesMethods,
  getNavigation,
  getNavigationPages
}
