const shorthash = require('shorthash')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const pickProperties = (obj, props) => {
  const picked = {}
  props.forEach(prop => {
    if (obj[prop] !== undefined) {
      picked[prop] = deepClone(obj[prop])
    }
  })
  return picked
}

const redactProp = (prop) => {
  const length = prop.length
  return `${length} char${length === 1 ? '' : 's'}`
}
const serializeRequest = (req) => {
  const props = [
    'method',
    'url',
    'headers',
    'httpVersion',
    'upgrade'
  ]
  const reqObj = pickProperties(req, props)

  if (reqObj.headers.cookie) {
    const cookiePieces = reqObj.headers.cookie.split('; ')
    reqObj.headers.cookie = ''
    reqObj.cookie = {}
    cookiePieces.forEach(cookie => {
      const [name, value] = cookie.split('=')
      reqObj.cookie[name] = shorthash.unique(value)
    })
    reqObj.headers.cookie = Object.keys(reqObj.cookie)
      .map(name => `${name}=${reqObj.cookie[name]}`)
      .join('; ')
  }

  const redactProps = [
    'body',
    'query',
    'params',
    'data',
    'query_string'
  ]
  redactProps.forEach(prop => {
    if (req[prop] !== undefined && req[prop] !== null) {
      let reqProp = req[prop]
      const isString = typeof reqProp === 'string'
      if (isString) {
        reqProp = JSON.parse(reqProp)
      }
      Object.keys(reqProp).forEach(key => {
        reqObj[prop] = reqObj[prop] || {}
        const type = Array.isArray(reqProp[key]) ? 'array' : typeof reqProp[key]
        let propString = ''
        if (type === 'array') {
          propString = 'array: '
          propString += reqProp[key]
            .map((item, index) => `[${index}] - ${typeof item} - ${redactProp(item)}`)
            .join('; ')
        } else {
          propString = `${type} - ${redactProp(reqProp[key])}`
        }
        reqObj[prop][key] = `[REDACTED - ${propString}]`
      })
      if (isString) {
        reqObj[prop] = JSON.stringify(reqObj[prop])
      }
    }
  })

  return reqObj
}

const serializeError = (error) => {
  const props = [
    'name',
    'code',
    'message',
    'columnNumber',
    'fileName',
    'lineNumber',
    'stack',
    'statusCode',
    'statusMessage',
    'body',
    'client_headers',
    'response'
  ]

  const errorObj = pickProperties(error, props)
  if (error.response) {
    const responseProps = [
      'statusCode',
      'statusMessage',
      'body',
      'headers',
      'timings'
    ]
    errorObj.response = pickProperties(error.response, responseProps)
  }
  return errorObj
}

module.exports = {
  serializeRequest,
  serializeError
}
