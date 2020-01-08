const cloneDeep = require('lodash.clonedeep')

function internationalizeRouteInstances (instances) {
  // provide fallback i18nised URLs of form  /:lang/:url
  const service = instances.service || {}
  const languages = (service.languages || [])
    .filter((lang) => lang !== (service.languageDefault || 'en'))

  Object.values(instances)
    .filter(({_type}) => _type && _type.startsWith('page.'))
    .filter(({url}) => url)
    .forEach((instance) => {
      languages
        .forEach((lang) => {
          const urlLang = `url:${lang}`

          if (Reflect.has(instance, urlLang)) {
            const urlPath = Reflect.get(instance, urlLang)

            if (urlPath && !urlPath.startsWith('/')) {
              Reflect.set(instance, urlLang, '/'.concat(urlPath))
            }
          } else {
            Reflect.set(instance, urlLang, `/${lang}${instance.url}`.replace(/\/$/, ''))
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
const i18nUrls = (instances) => internationalizeRouteInstances(cloneDeep(instances))

module.exports = {
  i18nUrls
}
