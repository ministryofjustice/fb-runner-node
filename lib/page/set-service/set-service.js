const {default: produce} = require('immer')

const {
  getInstance
} = require('../../service-data/service-data')
const {getUrl} = require('../../route/route')

const setService = (pageInstance, userData) => {
  pageInstance = produce(pageInstance, draft => {
    let service = getInstance('config.service') || getInstance('service')
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

    const homepageUrl = getUrl('page.start', {}, userData.contentLang)
    service = produce(service, serviceDraft => {
      serviceDraft.homepageUrl = homepageUrl
      serviceDraft.serviceUrl = homepageUrl
      return serviceDraft
    })
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
