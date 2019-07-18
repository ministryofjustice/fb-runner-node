const {getInstanceProperty} = require('../../service-data/service-data')

const {
  getUrl,
  getData,
  getPreviousPage
} = require('../../route/route')

const addItem = (pageInstance, userData) => {
  // add another item
  let {add} = userData.getBodyInput()
  if (add) { // } && pageInstance.$validated) {
    let CHANGEPAGE = pageInstance.changepage
    let URL = pageInstance.url
    const req = userData.req
    const params = req.params

    let repeatableId = pageInstance._repeatableId
    const addParts = add.split('/')
    if (addParts[1]) {
      repeatableId = addParts[0]
      add = addParts[1]
    }

    let defaultCurrent = 1
    if (repeatableId) {
      // const repeatableInstance = getInstance(repeatableId)
      defaultCurrent = getInstanceProperty(repeatableId, 'repeatableMinimum')
      if (defaultCurrent === undefined) {
        defaultCurrent = 1
      }
    }
    const addCount = userData.getUserCountProperty(add) || {
      current: defaultCurrent,
      minimum: defaultCurrent
    }
    if (!addCount.maximum || addCount.current < addCount.maximum) {
      addCount.current++
      userData.setUserCountProperty(add, addCount)
    } else {
      // Add error - ie invalidate page and render
    }
    if (repeatableId) {
      let repeatablePage = {_id: pageInstance._id, params}
      while (repeatablePage && repeatablePage._id !== repeatableId) {
        repeatablePage = getPreviousPage(repeatablePage, userData)
      }
      if (repeatablePage) {
        URL = getUrl(repeatablePage._id, repeatablePage.params, userData.contentLang)
      }
    }
    if (!CHANGEPAGE) {
      const REFERRER = (req.get('referrer') || '').replace(/.*\/\/.*?\//, '/')
      const referrerPageData = getData(REFERRER)
      if (referrerPageData) {
        const referrerPageType = getInstanceProperty(referrerPageData.route, '_type')
        if (referrerPageType === 'page.summary') {
          const summaryOf = getInstanceProperty(referrerPageData.route, 'summaryOf')
          if (!summaryOf) {
            CHANGEPAGE = REFERRER
          }
        }
      }
    }

    pageInstance.url = URL
    pageInstance.changepage = CHANGEPAGE
    pageInstance.redirectToSelf = true
  }
  return pageInstance
}

module.exports = addItem
