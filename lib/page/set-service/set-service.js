const {default: produce} = require('immer')

const {
  getInstance
} = require('../../service-data/service-data')

const setService = (pageInstance, userData) => {
  pageInstance = produce(pageInstance, draft => {
    let service = getInstance('config.service') || getInstance('service')
    let header = getInstance('config.header')
    draft.header = header || {}
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

    draft.service = service
    draft.footer = footer

    // TODO: move to editor
    if (draft.MODE) {
      if (!draft.MODE.match(/^(live|preview)$/)) {
        delete draft.footer
      }
    }
  })

  return pageInstance
}

module.exports = setService
