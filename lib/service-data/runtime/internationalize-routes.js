const {deepClone} = require('@ministryofjustice/fb-utils-node')

const internationalizeRouteInstances = (instances) => {
  // provide fallback i18nised URLs of form  /:lang/:url
  const service = instances.service || {}
  const languages = (service.languages || []).filter(lang => lang !== (service.languageDefault || 'en'))
  Object.keys(instances).filter(_id => instances[_id]._type && instances[_id]._type.startsWith('page.'))
    .filter(_id => instances[_id].url)
    .forEach(_id => {
      const instance = instances[_id]
      languages.forEach(lang => {
        const urlLang = `url:${lang}`
        if (instance[urlLang] === undefined) {
          instance[urlLang] = `/${lang}${instance.url}`.replace(/\/$/, '')
        } else {
          if (instance[urlLang] && !instance[urlLang].startsWith('/')) {
            instance[urlLang] = `/${instance[urlLang]}`
          }
        }
      })
    })
  return instances
}

/**
 * Internationalise page urls
 *
 * @param {object} instances
 *  Object of service instances keyed by id
 *
 * @return {object}
 *  Cloned object containing instances with i18nised urls
 **/
const i18nUrls = (instances) => {
  return internationalizeRouteInstances(deepClone(instances))
}

module.exports = {
  i18nUrls
}
