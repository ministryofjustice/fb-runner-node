const test = require('tape')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {i18nUrls} = require('./internationalize-routes')

const instancesSource = {
  service: {
    _id: 'service',
    languages: ['en', 'cy'],
    languageDefault: 'en'
  },
  a: {
    _id: 'a',
    _type: 'page.type',
    url: '/a'
  },
  b: {
    _id: 'b',
    _type: 'page.type',
    url: '/b',
    'url:cy': 'cymraeg-b'
  },
  c: {
    _id: 'c',
    _type: 'page.type',
    url: '/c',
    'url:cy': ''
  },
  d: {
    _id: 'd',
    url: '/d'
  }
}

test('When a service has values for languages and a default language', function (t) {
  const instances = deepClone(instancesSource)
  const i18nInstances = i18nUrls(instances)
  t.equal(i18nInstances.a['url:en'], undefined, 'it should not create a lang-specific url for the default language')
  t.equal(i18nInstances.a['url:cy'], '/cy/a', 'it should prefix lang-specific urls with the lang')
  t.equal(i18nInstances.b['url:cy'], '/cymraeg-b', 'it should use explicit lang-specific urls if found')
  t.equal(i18nInstances.c['url:cy'], '', 'it should ignore explicit lang-specific urls that have no value')
  t.equal(i18nInstances.d['url:cy'], undefined, 'it should ignore lang-specific urls for non-pages')
  t.end()
})

test('When a service has values for languages and no default language', function (t) {
  const instances = deepClone(instancesSource)
  delete instances.service.languageDefault
  const i18nInstances = i18nUrls(instances)
  t.equal(i18nInstances.a['url:en'], undefined, 'it should not create a lang-specific url for the default language')
  t.equal(i18nInstances.a['url:cy'], '/cy/a', 'it should prefix lang-specific urls with the lang')
  t.equal(i18nInstances.b['url:cy'], '/cymraeg-b', 'it should use explicit lang-specific urls if found')
  t.equal(i18nInstances.c['url:cy'], '', 'it should ignore explicit lang-specific urls that have no value')
  t.equal(i18nInstances.d['url:cy'], undefined, 'it should ignore lang-specific urls for non-pages')
  t.end()
})

test('When a service has no values for languages', function (t) {
  const instances = deepClone(instancesSource)
  delete instances.service.languages
  const i18nInstances = i18nUrls(instances)
  t.equal(i18nInstances.a['url:en'], undefined, 'it should not create a lang-specific url for the default language')
  t.equal(i18nInstances.a['url:cy'], undefined, 'it should not create a lang-specific url for an unspecified language')
  t.equal(i18nInstances.b['url:cy'], 'cymraeg-b', 'it should leave explicit lang-specific urls untouched if found')
  t.equal(i18nInstances.c['url:cy'], '', 'it should ignore explicit lang-specific urls that have no value')
  t.equal(i18nInstances.d['url:cy'], undefined, 'it should ignore lang-specific urls for non-pages')
  t.end()
})
