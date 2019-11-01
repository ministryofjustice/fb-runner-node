const expected = {
  answers: [
    {
      heading: 'This is the sectionHeadingSummary',
      level: 2
    },
    {
      heading: 'This is a heading for page 1',
      repeatable: undefined,
      level: 3
    },
    {
      answers: [
        {
          page: 'some_id',
          component: 'some name page 1',
          key: {
            html: undefined
          },
          value: {
            html: '<p>answer</p>',
            text: 'answer',
            machine: 'machine answer'
          },
          actions: {
            items: [
              {
                href: 'some_id,,/change/some_url',
                text: 'Change',
                visuallyHiddenText: 'your answer for undefined'
              }
            ]
          }
        }
      ]
    },
    {
      heading: 'This is the sectionHeadingSummary 2',
      level: 2
    },
    {
      answers: [
        {
          page: 'some_id_for_page_2',
          component: 'some_name_page_2_item_1',
          key: {
            html: undefined
          },
          value: {
            html: '<p>answer</p>',
            text: 'answer',
            machine: 'machine answer'
          },
          actions: {
            items: [
              {
                href: 'some_id_for_page_2,,/change/some_url',
                text: 'Change',
                visuallyHiddenText: 'your answer for undefined'
              }
            ]
          }
        },
        {
          page: 'some_id_for_page_2',
          component: 'some_name_page_2_item_2',
          key: {
            html: undefined
          },
          value: {
            html: '<p>answer</p>',
            text: 'answer',
            machine: 'machine answer'
          },
          actions: {
            items: [
              {
                href: 'some_id_for_page_2,,/change/some_url',
                text: 'Change',
                visuallyHiddenText: 'your answer for undefined'
              }
            ]
          }
        },
        {
          page: 'some_id_for_page_2',
          component: 'some_name_page_2_item_3',
          key: {
            html: undefined
          },
          value: {
            html: '<p>answer</p>',
            text: 'answer',
            machine: 'machine answer'
          },
          actions: {
            items: [
              {
                href: 'some_id_for_page_2,,/change/some_url',
                text: 'Change',
                visuallyHiddenText: 'your answer for undefined'
              }
            ]
          }
        },
        {
          page: 'some_id_for_page_2',
          component: 'some_name_page_2_item_4',
          key: {
            html: undefined
          },
          value: {
            html: '<p>answer</p>',
            text: 'answer',
            machine: 'machine answer'
          },
          actions: {
            items: [
              {
                href: 'some_id_for_page_2,,/change/some_url',
                text: 'Change',
                visuallyHiddenText: 'your answer for undefined'
              }
            ]
          }
        }
      ]
    }
  ]
}

module.exports = expected
