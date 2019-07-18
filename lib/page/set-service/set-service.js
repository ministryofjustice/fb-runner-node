const {
  getInstance
} = require('../../service-data/service-data')

const setService = (pageInstance, userData) => {
  let service = getInstance('config.service') || getInstance('service')
  let header = getInstance('config.header')
  pageInstance.header = header || {}
  let navigation = getInstance('config.navigation')
  let meta = getInstance('config.meta')
  let footer
  if (navigation || meta) {
    footer = {}
    if (meta) {
      footer.meta = meta
    }
    if (navigation) {
      footer.navigation = navigation.navigation
    }
    const builtBy = 'MoJ Digital'
    const builtByLink = 'https://mojdigital.blog.gov.uk/about/'
    footer.html = `Built by [${builtBy}](${builtByLink})`
  }

  pageInstance.service = service
  pageInstance.footer = footer

  // TODO: move to editor
  if (pageInstance.MODE) {
    if (!pageInstance.MODE.match(/^(live|preview)$/)) {
      delete pageInstance.footer
    }
  }

  return pageInstance
}

module.exports = setService
