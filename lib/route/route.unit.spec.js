const test = require('tape')

const route = require('./route')

const serviceData = require('../service-data/service-data')
const {getUserDataMethods} = require('../middleware/user-data/user-data')

const instances = {
  a: {_id: 'a', url: '/a'},
  b: {_id: 'b', url: '/b/:param'},
  c: {_id: 'c', url: '/c'},
  d: {_id: 'd', url: '/d/:param1/x/:param2'},
  e: {_id: 'e', url: '/e/:param*'},
  f: {_id: 'f', url: '/f/:param?'},
  f2: {_id: 'f2', url: '/f:param+'},
  g: {_id: 'g', url: '/g/:param([a-z]{4})+'},
  icon: {_id: 'icon', url: '/icon-:param(\\d+).png'},
  multiq: {_id: 'multiq', url: '/admin/instances/new/:addInstance?/:addProperty?/:addPosition?'},
  stubParam: {_id: 'stubParam', url: '/stub/:param'},
  stub: {_id: 'stub', url: '/stub'},
  stubNew: {_id: 'stubNew', url: '/stub/new'},
  root: {_id: 'root', url: '/'}
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
  },
  {
    description: 'it should return correct value for url with multiple optional params but none are passed',
    url:
      '/admin/instances/new',
    data: {route: 'multiq', params: {addInstance: undefined, addProperty: undefined, addPosition: undefined}}
  },
  {
    description: 'it should return correct value for url with multiple optional params but only the first is passed',
    url:
      '/admin/instances/new/x',
    data: {route: 'multiq', params: {addInstance: 'x', addProperty: undefined, addPosition: undefined}}
  },
  {
    description: 'it should return correct value for url with multiple optional params',
    url:
      '/admin/instances/new/x/y',
    data: {route: 'multiq', params: {addInstance: 'x', addProperty: 'y', addPosition: undefined}}
  },
  {
    description: 'it should return correct value for url with multiple optional params',
    url:
      '/admin/instances/new/x/y/z',
    data: {route: 'multiq', params: {addInstance: 'x', addProperty: 'y', addPosition: 'z'}}
  },
  {
    description: 'it should return correct value for url with simple path',
    url:
      '/stub',
    data: {route: 'stub'}
  },
  {
    description: 'it should return correct value for url with simple path',
    url:
      '/stub/new',
    data: {route: 'stubNew'}
  },
  {
    description: 'it should return correct value for url with simple path',
    url:
      '/stub/bar',
    data: {route: 'stubParam', params: {param: 'bar'}}
  },
  {
    description: 'it should return correct value for root url',
    url:
      '/',
    data: {route: 'root'}
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

  // check what happens if requested route doesn't exist
  t.equal(routeMethods.getUrl('z', {}), undefined, 'it should return undefined if the page instance does not exist')

  t.end()
})

test('When matching routes with a baseUrl', t => {
  const routeMethods = route.init(instances, '/prefix')

  t.deepEqual(routeMethods.getData('/a'), {route: 'a'}, 'it should return the correct data')
  t.equal(routeMethods.getUrl('a', {}), '/prefix/a', 'it should return correctly prefixed urls')
  t.equal(routeMethods.getUrl('z', {}), undefined, 'it should return undefined if the page instance does not exist')

  t.end()
})

test('When considering which page to go to', t => {
  const serviceInstances = {
    a: {
      steps: ['b', 'c', 'd']
    },
    b: {
      _parent: 'a',
      steps: ['b1', 'b2']
    },
    b1: {
      _parent: 'b'
    },
    b2: {
      _parent: 'b'
    },
    c: {
      _parent: 'a',
      show: {
        identifier: 'check',
        operator: 'defined',
        negated: true
      }
    },
    d: {
      _parent: 'a',
      steps: ['d1']
    },
    d1: {
      _parent: 'd',
      steps: ['d1A']
    },
    d1A: {
      _parent: 'd1'
    },
    x: {
      _id: 'x',
      model: 'x',
      $models: ['x'],
      repeatable: true,
      repeatableMaximum: 2,
      steps: ['y']
    },
    y: {
      _id: 'y',
      model: 'y',
      $models: ['x', 'y'],
      repeatable: true,
      repeatableMaximum: 3,
      steps: ['z']
    },
    z: {
      _id: 'z',
      model: 'z',
      $models: ['x', 'y', 'z'],
      repeatable: true,
      repeatableMinimum: 0
    }
  }
  serviceData.setServiceInstances(serviceInstances)

  let userData = getUserDataMethods({input: {}, count: {}})
  let userDataDefined = getUserDataMethods({input: {check: true}, count: {e: 2, e1: 2, e2: 1}})
  // let userCountData = getUserDataMethods({input: {},
  //   params: {
  //     x: 1,
  //     y: 1,
  //     z: 1
  //   },
  //   count: {
  //     x: 1,
  //     'x[1]y': 2,
  //     'x[1]y[2]z': 5
  //   }})

  const tests = [
    {input: 'a', userData, output: 'b'},
    {input: 'b', userData, output: 'b1'},
    {input: 'b1', userData, output: 'b2'},
    {input: 'b2', userData, output: 'c'},
    {input: 'c', userData, output: 'd'},
    {input: 'd', userData, output: 'd1'},
    {input: 'd1', userData, output: 'd1A'},
    {input: 'd1A', userData, output: undefined},
    {input: undefined, userData, output: 'a'},
    {input: 'b2', userData: userDataDefined, output: 'd', skip: 'c'}
    // {input: 'foo', userData: userCountData, output: 'bar'}
  ]

  const {getNextPage, getPreviousPage} = route

  tests.forEach(nextTest => {
    const {input, output, userData, skip} = nextTest
    const skipMessage = skip ? `, skipping ${skip} when ${skip} should not be shown` : ''
    if (input) {
      t.equal(getNextPage(input, userData), output, `it should go forward from ${input} to ${output}${skipMessage}`)
    }
    if (output) {
      t.equal(getPreviousPage(output, userData), input, `it should go back from ${output} to ${input}${skipMessage}`)
    }
  })

  t.end()
})
