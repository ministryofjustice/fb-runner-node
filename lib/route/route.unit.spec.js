const test = require('tape')

const route = require('./route')

const instances = {
  a: {_id: 'a', url: '/a'},
  b: {_id: 'b', url: '/b/:param'},
  c: {_id: 'c', url: '/c'},
  d: {_id: 'd', url: '/d/:param1/x/:param2'},
  e: {_id: 'e', url: '/e/:param*'},
  f: {_id: 'f', url: '/f/:param?'},
  f2: {_id: 'f2', url: '/f:param+'},
  g: {_id: 'g', url: '/g/:param([a-z]{4})+'},
  icon: {_id: 'icon', url: '/icon-:param(\\d+).png'}
}

const NOTFOUND = undefined

const checkUrls = [
  {
    description: 'it should return correct value for url with no params',
    url: '/a',
    data: {route: 'a'}
  },
  {
    description: 'it should return correct value for url with one param',
    url: '/b/foo',
    data: {route: 'b', params: {param: 'foo'}}
  },
  {
    description: 'it should return correct value for another url with no params',
    url: '/c',
    data: {route: 'c'}
  },
  {
    description: 'it should return 404 for url which does not match',
    url: '/c/x',
    data: NOTFOUND
  },
  {
    description: 'it should return correct value for url with multiple params',
    url: '/d/1/x/5',
    data: {route: 'd', params: {param1: '1', param2: '5'}}
  },
  {
    description: 'it should return correct value for url which has a greedy param (*)',
    url:
      '/e/foo/bar',
    data: {route: 'e', params: {param: 'foo/bar'}},
    input: {route: 'e', params: {param: ['foo', 'bar']}}
  },
  {
    description: 'it should return correct value for url with an optional param (?)',
    url: '/f/jjj',
    data: {route: 'f', params: {param: 'jjj'}}
  },
  {
    description: 'it should return correct value for url without an optional param and a trailing slash',
    url: '/f/',
    data: {route: 'f', params: {param: undefined}},
    skipGetUrl: true
  },
  {
    description: 'it should return correct value for url without an optional param',
    url: '/f',
    data: {route: 'f', params: {param: undefined}}
  },
  {
    description: 'it should return correct value for url with param not separated by slash delimiter',
    url: '/fool',
    data: {route: 'f2', params: {param: 'ool'}}
  },
  {
    description: 'it should return 404 for url without a required param',
    url: '/g',
    data: NOTFOUND
  },
  {
    description: 'it should return correct value for url with param that explicitly details match pattern',
    url: '/g/biff',
    data: {route: 'g', params: {param: 'biff'}}
  },
  {
    description: 'it should return 404 for url with param that fails to match explicit pattern (too many chars)',
    url: '/g/biffy',
    data: NOTFOUND
  },
  {
    description: 'it should return 404 for url with param that fails to match explicit pattern (wrong chars)',
    url: '/g/bif4',
    data: NOTFOUND
  },
  {
    description: 'it should return correct value for url with non-delimited param that explicitly details match pattern',
    url: '/icon-239.png',
    data: {route: 'icon', params: {param: '239'}}
  },
  {
    description: 'it should return 404 for url with non-delimited param that fails to match explicit pattern (wrong chars)',
    url: '/icon-a39.png',
    data: NOTFOUND
  }
]

test('When matching a url against registered page instances', t => {
  const routeMethods = route.init(instances)

  checkUrls.forEach(url => {
    t.deepEqual(routeMethods.getData(url.url), url.data, url.description)
  })

  t.end()
})

test('When creating a url for a page instance', t => {
  const routeMethods = route.init(instances)

  checkUrls.forEach(url => {
    const data = url.input || url.data
    if (data !== NOTFOUND && !url.skipGetUrl) {
      t.deepEqual(routeMethods.getUrl(data.route, data.params), url.url, url.description)
    }
  })

  t.end()
})
