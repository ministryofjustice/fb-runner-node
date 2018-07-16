/**
 * @module route
 **/

const pathToRegexp = require('path-to-regexp')

const init = (instances) => {
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
  const getUrl = (route, params) => getRouteUrl(pageMethods, route, params)
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
  const url = getUrl(params, {encode: (value, token) => value})
  return url
}

module.exports = {
  init,
  getRouteData,
  getRouteUrl
}
