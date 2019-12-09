require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')
const {setWidthClass} = require('@ministryofjustice/fb-components/templates/nunjucks/helpers')
const {format} = require('~/fb-runner-node/format/format')

const sizeElementMappings = require('~/fb-runner-node/element-size-mappings/element-size-mappings')

const updateLabel = (instance, prop) => {
  if (instance[prop]) {
    const html = instance[prop].html || instance[prop]
    instance[prop] = {
      html,
      classes: 'govuk-visually-hidden'
    }
  }
}

const kludgeUpdates = (pageInstance, userData) => {
  // TODO: make this unnecessary
  if (pageInstance._type.match(/(singlequestion|form)/)) {
    pageInstance._form = true
  }

  if (pageInstance._type === 'page.start') {
    if (pageInstance.actions && pageInstance.actions.primary) {
      pageInstance.actions.primary.isStartButton = true
    }
  }

  // add flag to use autocomplete assets
  if (jsonPath.query(pageInstance, '$..[?(@._type === "autocomplete")]').length) {
    pageInstance.$useAutocomplete = true
  }

  // update table html values
  const data = Object.assign({}, userData ? userData.getUserData() : {})
  const lang = userData ? userData.contentLang : undefined
  const tableNodes = [].concat(jsonPath.nodes(pageInstance, '$..[?(@._type === "table")].head[*]'))
    .concat(jsonPath.nodes(pageInstance, '$..[?(@._type === "table")].rows[*][*]'))
    .map(item => item.value)
    .filter(value => value.html)
  tableNodes.forEach(value => {
    value.html = format(value.html, data, {lang})
  })

  // Use row items as rows
  jsonPath.apply(pageInstance, '$..[?(@._type === "table")]', val => {
    if (val.head && val.head.items) {
      val.head = val.head.items
    }
    if (val.rows) {
      val.rows = val.rows.map(row => row.items ? row.items : row)
    }
    return val
  })
  // Apply cell widths
  jsonPath.apply(pageInstance, '$..[?(@._type === "cell")]', val => {
    val = setWidthClass(val)
    return val
  })

  // Hide requested labels and legends
  const nameInstances = jsonPath.query(pageInstance, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    if (nameInstance.labelhide) {
      updateLabel(nameInstance, 'legend')
      updateLabel(nameInstance, 'label')
    }
  })

  // TODO: shift this to correct place
  if (pageInstance._type === 'page.singlequestion' || pageInstance._singlequestion === true) {
    const question = pageInstance.components ? pageInstance.components[0] : undefined
    if (!question) {
      return pageInstance
    }
    if (question._type === 'group') {
      const questionId = question._$repeatableId
      pageInstance.heading = question.heading
      pageInstance.$headingId = questionId
      pageInstance.$headingProperty = questionId ? 'repeatableHeading' : undefined
      pageInstance.lede = question.lede
      pageInstance.$ledeId = questionId
      pageInstance.$ledeProperty = questionId ? 'repeatableLede' : undefined
      question.heading = undefined
      question.lede = undefined
    } else {
      let heading = question.label || question.legend
      if (heading === undefined) {
        heading = '<i>Please set component heading</i>'
      }
      if (typeof heading === 'string' || heading === undefined) {
        heading = {
          html: heading
        }
      }
      heading.isPageHeading = true
      heading.classes = heading.classes || ''

      question.label = heading
      delete question.legend
    }
  } else {
    let headingClass = sizeElementMappings.getClass(`heading.${pageInstance._type}`)
    if (!headingClass) {
      headingClass = sizeElementMappings.getClass('heading')
    }
    pageInstance.headingClass = pageInstance.headingClass || ''
    pageInstance.headingClass += headingClass
    if (!pageInstance.heading) {
      pageInstance.heading = '<i>Please set page heading</i>'
    }
  }
  return pageInstance
}

module.exports = kludgeUpdates
