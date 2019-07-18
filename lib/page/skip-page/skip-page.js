const skipPage = (pageInstance, userData) => {
  if (pageInstance._type === 'page.confirmation') {
    return pageInstance
  }
  if (pageInstance.show !== undefined) {
    const showPage = userData.evaluate(pageInstance.show, {
      page: pageInstance,
      instance: pageInstance
    })
    if (!showPage) {
      pageInstance.$skipPage = true
      if (!pageInstance.nextpage) {
        throw new Error(404)
      } else {
        pageInstance.redirect = pageInstance.nextpage
      }
    }
  }

  return pageInstance
}

module.exports = skipPage
