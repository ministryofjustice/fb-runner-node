module.exports = {
  populateAnswerBucket: {
    page: 'page id',
    component: 'component name',
    key: {
      html: 'component label',
      text: 'stripped text'
    },
    value: {
      html: 'display value',
      text: 'stripped text',
      machine: 'user data property'
    },
    actions: {
      items: [
        {
          href: 'page-url/change/page-url',
          text: 'Change',
          visuallyHiddenText: 'Your answer for component label'
        }
      ]
    },
    groupBy: 'component name'
  },
  populateFileUploadAnswerBucket: {
    page: 'page id',
    component: 'component name',
    key: {
      html: 'component label',
      text: 'stripped text'
    },
    value: {
      html: 'display value',
      text: 'stripped text',
      machine: []
    },
    actions: {
      items: [
        {
          href: 'page-url/change/page-url',
          text: 'Change',
          visuallyHiddenText: 'Your answer for component label'
        }
      ]
    },
    groupBy: 'component name'
  },
  populateCheckboxesAnswerBucket: {
    withLabel: {
      page: 'page id',
      component: 'checkbox 1 name',
      key: {
        html: 'component label',
        text: 'stripped text'
      },
      value: {
        html: 'formatted and replaced html',
        text: 'stripped text',
        machine: 'checkbox 1 value'
      },
      actions: {
        items: [
          {
            href: 'page-url/change/page-url',
            text: 'Change',
            visuallyHiddenText: 'Your answer for component label'
          }
        ]
      },
      groupBy: 'checkbox 1 name'
    },
    withoutLabel: {
      page: 'page id',
      component: 'checkbox 1 name',
      key: {
        html: 'component label',
        text: 'stripped text'
      },
      value: {
        html: 'formatted and replaced html',
        text: 'stripped text',
        machine: 'stripped text'
      },
      actions: {
        items: [
          {
            href: 'page-url/change/page-url',
            text: 'Change',
            visuallyHiddenText: 'Your answer for component label'
          }
        ]
      },
      groupBy: 'checkbox 1 name'
    }
  }
}
