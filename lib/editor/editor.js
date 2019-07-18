const {
  getUrl,
  getNavigation
} = require('../route/route')

const {
  getSchemaNestableProperties,
  getInstanceTitle,
  isPage
} = require('../service-data/service-data')

const editorMethods = {}

editorMethods.setEditorModes = async (pageInstance, userData) => {
  const EDITMODE = userData.EDITMODE
  pageInstance = Object.assign({}, pageInstance, {
    EDITMODE,
    MODE: EDITMODE || 'live',
    MODEURL: pageInstance.url
  })
  return pageInstance
}

editorMethods.setEditorNavigation = async (pageInstance, userData) => {
  const EDITMODE = userData.EDITMODE
  if (EDITMODE) {
    const previewNav = getNavigation(pageInstance._id)
    if (previewNav) {
      if (previewNav.nextpage) {
        pageInstance.preview = pageInstance.preview || {}
        pageInstance.preview.next = {
          title: getInstanceTitle(previewNav.nextpage),
          url: `${getUrl(previewNav.nextpage)}/${EDITMODE}`.replace(/\/\//, '/')
        }
      }
      if (previewNav.previouspage) {
        pageInstance.preview = pageInstance.preview || {}
        pageInstance.preview.previous = {
          title: getInstanceTitle(previewNav.previouspage),
          url: `${getUrl(previewNav.previouspage)}/${EDITMODE}`.replace(/\/\//, '/')
        }
      }
    }
  }
  return pageInstance
}

editorMethods.setAdders = async (pageInstance, userData) => {
  const EDITMODE = userData.EDITMODE
  if (EDITMODE === 'edit') {
    const addAdders = (instance) => {
      const nestableProperties = getSchemaNestableProperties(instance._type)
      nestableProperties.forEach(propertyObj => {
        const {title, property, required, maxItems, minItems} = propertyObj
        if (Array.isArray(instance[property])) {
          instance[property].forEach(propertyInstance => {
            addAdders(propertyInstance)
          })
        }
        const itemsCount = instance[property] ? instance[property].length : 0
        const hasMaxItems = maxItems && itemsCount >= maxItems
        if (hasMaxItems) {
          return
        }
        // if (!maxItems || itemsCount < maxItems) {
        // if (instance[property] || required) {
        let addTitle = title || property.replace(/([A-Z])/g, (m, m1) => {
          return ` ${m1.toLowerCase()}`
        })
        addTitle = addTitle.replace(/ies$/, 'y').replace(/s$/, '').toLowerCase()
        const addHtml = `Add ${addTitle}`
        const addBundle = instance._id ? {
          _type: 'addblock',
          html: addHtml,
          href: `/admin/new/${instance._id}/${property}/edit`,
          minItems,
          maxItems,
          hasMaxItems,
          required
        } : undefined

        if (isPage(instance)) {
          // instance[property] = instance[property] || []
          // instance[property].$blockAdd = addBundle
          instance[`$addBlock${property}`] = addBundle
        } else {
          instance.$addBlock = addBundle
        }
        // console.log({property, instance})
        // instance[property] = instance[property] || []
        // instance[property].push({
        //   _type: 'content',
        //   html: `[Add ${property}](/admin/new/${instance._id}/${property}/edit)`
        // })
        // }
        // }
      })
    }
    addAdders(pageInstance)
  }
  return pageInstance
}

editorMethods.setEditorControls = async (pageInstance, userData) => {
  pageInstance = await editorMethods.setEditorNavigation(pageInstance, userData)
  pageInstance = await editorMethods.setAdders(pageInstance, userData)
  return pageInstance
}

module.exports = editorMethods
