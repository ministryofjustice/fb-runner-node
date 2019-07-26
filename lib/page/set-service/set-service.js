const {
  getInstance
} = require('../../service-data/service-data')

const setService = (pageInstance, userData) => {
  const service = getInstance('config.service') || getInstance('service')
  const header = getInstance('config.header')
  pageInstance.header = header || {}
  const navigation = getInstance('config.navigation')
  const meta = getInstance('config.meta')
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
