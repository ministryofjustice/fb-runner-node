require('@ministryofjustice/module-alias/register-module')(module)

const { debugError } = require('~/fb-runner-node/middleware/nunjucks-configuration/nunjucks-configuration')

const router = require('express').Router()
const {
  setService,
  formatProperties
} = require('~/fb-runner-node/page/page')

const USERDATA = {
  getUserData () { return {} },
  getUserParams () { return {} },
  getScope () { return {} },
  getScopedUserData () { return {} }
}

function init () {
  return router.use(/^\/([^.]+)$/, (req, res, next) => {
    /*
     *  1. This definsiveness is probably unecessary, but
     *  2. `req.params` is an object with a field key which is a number, rather than a string
     *
     *  So:
     *
     *    const view = req.params[0]
     *
     *  reads like an `req.params` is an array, and:
     *
     *    const view = req.params.0
     *
     *  is a syntax error, but:
     *
     *    const view = req.params['0']
     *
     *  gets the value yet looks wrong
     *
     *  Using `Reflect.has(req.params, 0)` and `Reflect.get(req.params, 0)` we can get the value
     *  from `req.params` regardless of whether it is an object or an array
     */
    if (Reflect.has(req.params, 0)) {
      const view = Reflect.get(req.params, 0)
      const path = `${view}.njk.html`

      let page = {
        _type: 'page.form',
        MODE: 'live'
      }

      const userData = req.user || USERDATA

      page = setService(page, userData)
      page = formatProperties(page, userData)

      const context = Object.assign({}, res.locals, { page })

      res.nunjucksAppEnv.render(path, context, (e, output) => {
        /*
         *  Deal with any errors first
         */
        if (e) {
          const {
            message = 'No error message defined'
          } = e

          return (message.toLowerCase().startsWith('template not found'))
            ? next(new Error(404))
            : debugError(e, next)
        }

        /*
         *  Otherwise, Nunjucks has rendered the output, so return it to the user
         */
        return res.send(output)
      })
    } else {
      /*
       *  Continue to the next middleware
       */
      next()
    }
  })
}

module.exports = {
  init
}
