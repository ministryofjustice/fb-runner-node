const test = require('tape')

const route = require('./route')

const serviceData = require('../service-data/service-data')
const {getUserDataMethods} = require('../middleware/user-data/user-data')

const serviceInstances = {
  service: {
    _id: 'service',
    languageDefault: 'en',
    languages: [
      'cy'
    ]
  },
  bParam: {
    _id: 'bParam',
    url: '/b/:param'
  },
  a: {
    steps: ['b', 'c', 'd', 'v', 'v.summary', 'w', 'x', 'e']
  },
  b: {
    _parent: 'a',
    steps: ['b1', 'b2'],
    show: {
      identifier: 'skipB',
      operator: 'defined',
      negated: true
    }
  },
  b1: {
    _parent: 'b',
    show: {
      identifier: 'check',
      operator: 'defined',
      negated: true
    }
  },
  b2: {
    _parent: 'b',
    show: {
      identifier: 'check',
      operator: 'defined',
      negated: true
    }
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
  e: {
    _parent: 'a'
  },
  v: {
    _id: 'v',
    _parent: 'a',
    namespace: 'v',
    $namespaces: ['v'],
    repeatable: true,
    repeatableMaximum: 3
  },
  'v.summary': {
    _repeatableId: 'v',
    _id: 'v.summary',
    _parent: 'a',
    namespace: 'v',
    steps: undefined,
    $namespaces: ['v']
  },
  w: {
    _id: 'w',
    _parent: 'a',
    namespace: 'w',
    $namespaces: ['w'],
    repeatable: true,
    repeatableMaximum: 3
  },
  x: {
    _id: 'x',
    _parent: 'a',
    namespace: 'x',
    $namespaces: ['x'],
    repeatable: true,
    repeatableMaximum: 2,
    steps: ['y'],
    show: {
      identifier: 'check',
      operator: 'defined',
      negated: true
    }
  },
  y: {
    _id: 'y',
    _parent: 'x',
    namespace: 'y',
    $namespaces: ['x', 'y'],
    repeatable: true,
    repeatableMaximum: 3,
    steps: ['z'],
    show: {
      identifier: 'check',
      operator: 'defined',
      negated: true
    }
  },
  z: {
    _id: 'z',
    _parent: 'y',
    namespace: 'z',
    $namespaces: ['x', 'y', 'z'],
    repeatable: true,
    repeatableMinimum: 0,
    show: {
      identifier: 'check',
      operator: 'defined',
      negated: true
    }
  }
}

serviceData.setServiceInstances(serviceInstances)
// const urlInstances = serviceData.getPageInstancesHash()

const urlInstances = {
  a: {_id: 'a', url: '/a', 'url:cy': '/cy/a'},
  bParam: {_id: 'bParam', url: '/b/:param'},
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
    description: 'it should return correct value for a welsh url with no params',
    url: '/cy/a',
    data: {route: 'a', lang: 'cy'}
  },
  {
    description: 'it should return correct value for url with one param',
    url: '/b/foo',
    data: {route: 'bParam', params: {param: 'foo'}}
  },
  {
    description: 'it should return correct value for url expecting a param, but no param is passed',
    url: '/b/1',
    data: {route: 'bParam'},
    skipGetData: true
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
// checkUrls.length = 2
// checkUrls.shift()

test('When matching a url against registered page instances', t => {
  const routeMethods = route.init(urlInstances)

  checkUrls.forEach(url => {
    if (!url.skipGetData) {
      t.deepEqual(routeMethods.getData(url.url), url.data, url.description)
    }
  })

  t.end()
})

test('When creating a url for a page instance', t => {
  const routeMethods = route.init(urlInstances)

  checkUrls.forEach(url => {
    const data = url.input || url.data
    if (data !== NOTFOUND && !url.skipGetUrl) {
      t.deepEqual(routeMethods.getUrl(data.route, data.params, data.lang), url.url, url.description)
    }
  })

  // check what happens if requested route doesn't exist
  t.equal(routeMethods.getUrl('z', {}), undefined, 'it should return undefined if the page instance does not exist')

  t.end()
})

test('When matching routes with a baseUrl', t => {
  const routeMethods = route.init(urlInstances, '/prefix')

  t.deepEqual(routeMethods.getData('/a'), {route: 'a'}, 'it should return the correct data')
  t.equal(routeMethods.getUrl('a', {}), '/prefix/a', 'it should return correctly prefixed urls')
  t.equal(routeMethods.getUrl('z', {}), undefined, 'it should return undefined if the page instance does not exist')

  t.end()
})

// test('When considering which page to go to', t => {

const userData = getUserDataMethods({input: {}, count: {}})
const userDataDefined = getUserDataMethods({
  input: {check: true},
  count: {
    v: {
      current: 2,
      maximum: 3
    },
    w: {
      current: 3,
      maximum: 3
    }
  }
})
const userDataSkipB = getUserDataMethods({input: {skipB: true}, count: {}})
const userCountData = getUserDataMethods({
  input: {},
  count: {
    x: {
      current: 2,
      maximum: 2
    },
    'x[1].y': {
      current: 2,
      maximum: 3
    },
    'x[1].y[2].z': {
      current: 3,
      minimum: 0
    }
  }
})

const tests = [

  {input: {_id: 'c'}, userData, output: {_id: 'd'}}
]

const workingTests = [
  {input: {_id: 'w', params: {w: 3}}, userData: userDataDefined, output: {_id: 'e'}},

  {input: undefined, userData, output: {_id: 'a'}},
  {input: {_id: 'a'}, userData, output: {_id: 'b'}},
  {input: {_id: 'b'}, userData, output: {_id: 'b1'}},
  {input: {_id: 'b1'}, userData, output: {_id: 'b2'}},
  {input: {_id: 'b2'}, userData, output: {_id: 'c'}},
  {input: {_id: 'c'}, userData, output: {_id: 'd'}},
  {input: {_id: 'd'}, userData, output: {_id: 'd1'}},
  {input: {_id: 'd1'}, userData, output: {_id: 'd1A'}},
  {input: {_id: 'd1A'}, userData, output: {_id: 'v', params: {v: 1}}},
  {input: {_id: 'v', params: {v: 1}}, userData, output: {_id: 'v.summary'}},
  {input: {_id: 'v.summary'}, userData, output: {_id: 'w', params: {w: 1}}},
  {input: {_id: 'w', params: {w: 1}}, userData, output: {_id: 'x', params: {x: 1}}},

  // impossible page
  {input: {_id: 'w', params: {w: 3}}, userData, output: {_id: 'x', params: {x: 1}}, noReverse: true},

  {input: {_id: 'x', params: {x: 1}}, userData, output: {_id: 'y', params: {x: 1, y: 1}}},
  {input: {_id: 'y', params: {x: 1, y: 1}}, userData, output: {_id: 'e'}},

  // impossible page
  {input: {_id: 'z', params: {x: 1, y: 1, z: 1}}, userData, output: {_id: 'e'}, noReverse: true},

  {input: {_id: 'e'}, userData, output: undefined},

  {input: {_id: 'a'}, userData: userDataSkipB, output: {_id: 'c'}, skip: 'b'},

  {input: {_id: 'b'}, userData: userDataDefined, output: {_id: 'd'}, skip: 'b1, b2 and c'},

  // impossible page
  {input: {_id: 'b2'}, userData: userDataDefined, output: {_id: 'd'}, skip: 'c', noReverse: true},

  {input: {_id: 'v', params: {v: 1}}, userData: userDataDefined, output: {_id: 'v', params: {v: 2}}},
  {input: {_id: 'v', params: {v: 2}}, userData: userDataDefined, output: {_id: 'v.summary'}},
  {input: {_id: 'v.summary'}, userData: userDataDefined, output: {_id: 'w', params: {w: 1}}},

  {input: {_id: 'w', params: {w: 1}}, userData: userDataDefined, output: {_id: 'w', params: {w: 2}}},
  {input: {_id: 'w', params: {w: 2}}, userData: userDataDefined, output: {_id: 'w', params: {w: 3}}},

  {input: {_id: 'y', params: {x: 1, y: 1}}, userData: userCountData, output: {_id: 'y', params: {x: 1, y: 2}}},
  {input: {_id: 'y', params: {x: 1, y: 2}}, userData: userCountData, output: {_id: 'z', params: {x: 1, y: 2, z: 1}}},
  {input: {_id: 'z', params: {x: 1, y: 2, z: 1}}, userData: userCountData, output: {_id: 'z', params: {x: 1, y: 2, z: 2}}},
  {input: {_id: 'z', params: {x: 1, y: 2, z: 2}}, userData: userCountData, output: {_id: 'z', params: {x: 1, y: 2, z: 3}}},
  {input: {_id: 'z', params: {x: 1, y: 2, z: 3}}, userData: userCountData, output: {_id: 'x', params: {x: 2}}},
  {input: {_id: 'x', params: {x: 2}}, userData: userCountData, output: {_id: 'y', params: {x: 2, y: 1}}},
  {input: {_id: 'y', params: {x: 2, y: 1}}, userData: userCountData, output: {_id: 'e'}}
]

tests.push(...workingTests)

const {getNextPage, getPreviousPage} = route

tests.forEach(nextTest => {
  test('When considering which page to go to', t => {
    const {input, output, userData, skip, noReverse} = nextTest
    const skipMessage = skip ? `, skipping ${skip} when ${skip} should not be shown` : ''
    if (input) {
      let testMessage
      const actualOutput = getNextPage(input, userData)
      if (output) {
        if (actualOutput.params) {
          if (!Object.keys(actualOutput.params).length) {
            delete actualOutput.params
          }
        }
        testMessage = `it should go forward from ${input._id} to ${output._id}${skipMessage}`
      } else {
        testMessage = `it should not go forward from ${input._id}`
      }
      t.deepEqual(actualOutput, output, testMessage)
    }
    if (output && !noReverse) {
      let testMessage
      const actualOutput = getPreviousPage(output, userData)
      if (actualOutput && actualOutput.params) {
        if (!Object.keys(actualOutput.params).length) {
          delete actualOutput.params
        }
      }
      testMessage = `it should not go backward from ${output._id}`
      if (input) {
        testMessage = `it should go back from ${output._id} to ${input._id}${skipMessage}`
      }
      t.deepEqual(actualOutput, input, testMessage)
    }
    t.end()
  })
})

// })
