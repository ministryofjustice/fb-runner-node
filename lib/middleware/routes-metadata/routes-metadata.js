const router = require('express').Router()
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {default: produce} = require('immer')

// const jp = require('jsonpath')
const {
  getTimestamp,
  getServiceSchema,
  getPageInstancesHash,
  getInstance,
  getInstanceProperty
} = require('../../service-data/service-data')

const route = require('../../route/route')
const {getNextUrl, getPreviousUrl} = route
const {
  skipPage,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents,
  kludgeUpdates
} = require('../../page/page')

let pagesMethods = {}
let navigation = {}

const getPagesMethods = () => {
  return pagesMethods
}
const initRoutes = () => {
  const pages = getPageInstancesHash()

  // initialise route url matching and creation methods
  pagesMethods = route.init(pages)

  // temporary next and previous page handling
  // TODO: implement proper next page method
  navigation = {}
  const startPage = getInstance(pagesMethods.getData('/').route)

  const setNavigation = (_id) => {
    let nextpage
    let previouspage
    const navPage = getInstance(_id)
    const steps = navPage.steps || []
    if (steps[0]) {
      nextpage = steps[0]
    }

    const parent = getInstance(navPage._parent)
    if (parent) {
      const stepIndex = parent.steps.indexOf(_id)
      if (stepIndex) {
        let previous = parent.steps[stepIndex - 1]
        while (getInstanceProperty(previous, 'steps')) {
          const previousSteps = getInstanceProperty(previous, 'steps')
          previous = previousSteps[previousSteps.length - 1]
        }
        previouspage = previous

        if (stepIndex < parent.steps.length - 1) {
          nextpage = nextpage || parent.steps[stepIndex + 1]
        } else {
          const grandparent = getInstance(parent._parent)
          if (grandparent) {
            const grandParentStepIndex = grandparent.steps.indexOf(parent._id)
            if (grandParentStepIndex < grandparent.steps.length - 1) {
              nextpage = nextpage || grandparent.steps[grandParentStepIndex + 1]
            }
          }
        }
      } else {
        nextpage = nextpage || parent.steps[1]
        if (!nextpage) {
          const getNextFromParent = (parentId) => {
            const parent = getInstance(parentId)
            let nextpage
            const grandparent = getInstance(parent._parent)
            if (grandparent) {
              const grandParentStepIndex = grandparent.steps.indexOf(parent._id)
              if (grandParentStepIndex < grandparent.steps.length - 1) {
                nextpage = grandparent.steps[grandParentStepIndex + 1]
              } else {
                nextpage = getNextFromParent(grandparent._id)
              }
            }
            return nextpage
          }
          nextpage = getNextFromParent(parent._id)
        }
        previouspage = parent._id
      }
    }

    navigation[_id] = {
      nextpage,
      previouspage
    }

    steps.forEach((step, index) => {
      setNavigation(step)
    })
  }
  setNavigation(startPage._id)

  serviceDataTimestamp = getTimestamp()
}

const metadataRouter = () => {
  initRoutes()
  router.use(pageHandler)
  return router
}

let serviceDataTimestamp

const pageHandler = (req, res, next) => {
  if (serviceDataTimestamp !== getTimestamp()) {
    initRoutes()
  }
  const url = req._parsedUrl.pathname.replace(/\/(edit|preview|flow)$/, '')

  const handlerData = pagesMethods.getData(url)

  if (!handlerData) {
    return next()
  } else {
    Object.assign(req.params, handlerData.params)
    const route = handlerData.route
    let pageInstance = deepClone(getInstance(route))
    const userData = produce(req.user, draft => {
      draft.pagesMethods = pagesMethods
    })
    userData.setParams(req.params)
    const POST = req.method === 'POST'
    const EDITMODE = req.editmode

    const nextUrl = getNextUrl(route, userData)
    if (nextUrl) {
      pageInstance.nextpage = nextUrl
    }
    const previousUrl = getPreviousUrl(route, userData)
    if (previousUrl) {
      pageInstance.previouspage = previousUrl
    }

    // Check whether page should be displayed
    if (!EDITMODE) {
      pageInstance = skipPage(pageInstance, userData)
      if (pageInstance.redirect) {
        return res.redirect(pageInstance.redirect)
      }
    }

    const propagatableCategories = ['control', 'grouping']
    const propagatableCache = {}
    const checkTypePropagatable = (_type) => {
      if (propagatableCache[_type] !== undefined) {
        return propagatableCache[_type]
      }
      const setPropagatable = (value) => {
        propagatableCache[_type] = value
        return value
      }
      if (_type === 'button') {
        return setPropagatable(false)
      }
      if (_type === 'checkbox') {
        return setPropagatable(true)
      }
      const schema = getServiceSchema(_type)
      const schemaCategory = schema.category
      if (schemaCategory) {
        for (let index = 0; index < schemaCategory.length; index++) {
          if (propagatableCategories.includes(schemaCategory[index])) {
            return setPropagatable(true)
          }
        }
      }
      return setPropagatable(false)
    }

    pageInstance = produce(pageInstance, draft => {
      const getDelimitedString = (a, b) => {
        if (a && a.endsWith(']') && b.includes('-')) {
          // b = `['${b}']`
        }
        const delimiter = !a || a.endsWith(']') ? '' : '.'
        return `${delimiter}${b}`.replace(/\.\[/, '[')
      }
      // TODO: is pageInstance repeatable?
      // TODO: does it have models and repeatables in its parental chain?
      const propagateModelNested = (instance, prop) => {
        const nestedInstances = instance[prop] || []
        nestedInstances.forEach((nestedInstance, index) => {
          propagateModelsRepeatable(nestedInstance, instance, prop, index)
        })
      }
      const propagateModelsRepeatable = (instance, parent, prop, parentIndex) => {
        if (!checkTypePropagatable(instance._type)) {
          return
        }
        let instanceModel = parent.$instanceModel || ''
        if (instance.model) {
          instanceModel = getDelimitedString(instanceModel, instance.model)
        }

        instance._idsuffix = parent._idsuffix || ''
        if (parent._idsuffix) {
          instance._id += parent._idsuffix
        }
        instance.$instanceModel = instanceModel
        let instances = [instance]
        if (instance.repeatable) {
          let instanceLookup = instanceModel
          if (instance.name) {
            instanceLookup = `${instanceModel}${getDelimitedString(instanceModel, instance.name)}`
          }
          const userCount = userData.getUserCountProperty(instanceLookup) || {}
          let instanceCount = userCount.current
          if (instanceCount === undefined) {
            instanceCount = instance.repeatableMinimum
            if (instanceCount === undefined) {
              instanceCount = 1
            }
            userCount.current = instanceCount
            userCount.minimum = instanceCount
            userCount.maximum = instance.repeatableMaximum
            userData.setUserCountProperty(instanceLookup, userCount)
          }
          // console.log({instanceLookup, instanceCount})
          const components = []
          instances = []
          const schema = getServiceSchema(instance._type)
          for (let count = 1; count <= instanceCount; count++) {
            const instanceCopy = deepClone(instance)
            if (instanceCount > 1 && instanceCopy.name) {
              instanceCopy.validation = instanceCopy.validation || {}
              instanceCopy.validation.required = true
            }
            const repeatableSuffix = `[${count}]`
            instanceCopy._id += `--${count}`
            instanceCopy._idsuffix += `--${count}`
            if (instanceCopy.legend) {
              instanceCopy.legend += ` ${count}`
            } else if (instanceCopy.label) {
              instanceCopy.label += ` ${count}`
            }
            if (instanceCopy.name) {
              instanceCopy.name += repeatableSuffix
              if (instanceCopy.$instanceModel) {
                instanceCopy.name = `${instanceCopy.$instanceModel}${getDelimitedString(instanceCopy.$instanceModel, instanceCopy.name)}`
              }
            } else {
              instanceCopy.$instanceModel += repeatableSuffix
            }
            const instanceCopyId = instanceCopy._id
            const componentGroup = {
              _id: `${instanceCopyId}--group`,
              _type: 'group',
              classes: 'fb-repeatable-item',
              components: [
                instanceCopy
              ]
            }
            if (userCount.current > userCount.minimum) {
              componentGroup.components.push({
                _id: `${instanceCopyId}--remove`,
                _type: 'button',
                html: instance.repeatableDelete || schema.properties.repeatableDelete.default,
                name: 'remove',
                classes: 'fb-action-secondary fb-action--delete',
                value: `${instanceLookup}=${count}`
              })
            }
            components.push(componentGroup)
            instances.push(instanceCopy)
          }
          const repeatGroup = {
            _id: `${instance._id}--group`,
            _type: 'group',
            heading: instance.repeatableHeading,
            lede: instance.repeatableLede,
            components
          }
          if (!instance.repeatableMaximum || instanceCount < instance.repeatableMaximum) {
            repeatGroup.add = {
              html: instance.repeatableAdd || schema.properties.repeatableAdd.default,
              name: 'add',
              classes: 'fb-action-secondary fb-action--add',
              value: instanceLookup
            }
          }
          parent[prop][parentIndex] = repeatGroup
        } else {
          if (instance.name && instance.$instanceModel) {
            instance.name = `${instance.$instanceModel}${getDelimitedString(instance.$instanceModel, instance.name)}`
          }
        }
        instances.forEach(inst => {
          propagateModelNested(inst, 'items')
          propagateModelNested(inst, 'components')
        })
      }
      propagateModelNested(draft, 'components')
      // console.log(JSON.stringify(draft, null, 2))
      return draft
    })

    // Remove unneeded components
    if (EDITMODE !== 'edit') {
      pageInstance = skipComponents(pageInstance, userData)
    }

    if (POST) {
      // handle inbound values
      pageInstance = processInput(pageInstance, userData, req.body)

      // remove item
      const {remove} = req.body
      if (remove) {
        const [removeLookup, removeIndex] = remove.split('=')
        // error if no such item

        const removeCount = userData.getUserCountProperty(removeLookup) || {}
        // error if no removeCount
        if (removeCount.current > removeCount.minimum) {
          const lookupArray = userData.getUserDataProperty(removeLookup)
          // error if item doesn't exist
          lookupArray.splice(removeIndex, 1)
          userData.setUserDataProperty(removeLookup, lookupArray)
          removeCount.current--
          userData.setUserCountProperty(removeLookup, removeCount)
        } else {
          // error if removing would take too low
        }

        return res.redirect(url)
      }

      // validate inbound values
      pageInstance = validateInput(pageInstance, userData)

      // add another item
      const {add} = req.body
      if (add && pageInstance.$validated) {
        const addCount = userData.getUserCountProperty(add) || {}
        if (!addCount.maximum || addCount.current < addCount.maximum) {
          addCount.current++
          userData.setUserCountProperty(add, addCount)
        } else {
          // Add error - ie invalidate page and render
        }
        // redirect to self
        return res.redirect(url)
      }

      // go to next page if valid
      if (!EDITMODE) {
        if (pageInstance.$validated && pageInstance.nextpage) {
          const nextUrl = getNextUrl(route, userData)
          if (nextUrl) {
            return res.redirect(nextUrl)
          }
        }
      }
    }

    // Format all the properties which need to be
    pageInstance = formatProperties(pageInstance, userData)

    // Update name values
    pageInstance = updateControlNames(pageInstance, userData)

    // TODO: remove setContent method from fb-nunjucks-helpers

    // TODO: make this unnecessary
    pageInstance = kludgeUpdates(pageInstance, userData)

    // render with Nunjucks
    renderPage(res, pageInstance)
  }
}

const renderPage = (res, pageInstance) => {
  // render with Nunjucks
  // set template path and context
  const templatePath = `${pageInstance._template || `${pageInstance._type.replace(/\./g, '/')}/template/nunjucks/${pageInstance._type}`}.njk.html`
  const context = {
    page: deepClone(pageInstance)
  }
  res.nunjucksAppEnv.render(templatePath, context, (err, output) => {
    if (err) {
      // TODO: log error not console.log(err)
      res.sendStatus(404)
      return
    }
    res.send(output)
  })
}

const getNavigation = (page) => {
  if (page) {
    return navigation[page]
  } else {
    return navigation
  }
}

module.exports = {
  init: metadataRouter,
  initRoutes,
  pageHandler,
  getPagesMethods,
  renderPage,
  getNavigation
}
