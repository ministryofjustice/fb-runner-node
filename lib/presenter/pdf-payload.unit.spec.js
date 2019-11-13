const test = require('tape')
const {pdfPayload} = require('./pdf-payload')
const expectedPayload = {
  submission_id: '1786c427-246e-4bb7-90b9-a2e6cfae003f / Tue, 08 Oct 2019 12:44:33 GMT',
  pdf_heading: 'Complain about a court or tribunal',
  pdf_subheading: '(Optional) Some section heading',
  sections: [
    {
      heading: 'Whats your name',
      summary_heading: 'WIP',
      questions: []
    }, {
      heading: '',
      summary_heading: '',
      questions: [
        {
          key: 'first_name',
          label: 'First name',
          answer: 'Bob',
          human_value: 'Bob'
        },
        {
          key: 'last_name',
          label: 'Last name',
          answer: 'Smith',
          human_value: 'Smith'
        }
      ]
    }, {
      heading: '',
      summary_heading: '',
      questions: [
        {
          key: 'email_address',
          label: 'Your email address',
          answer: 'bob.smith@gov.uk',
          human_value: 'bob.smith@gov.uk'
        }, {
          key: 'complaint_details',
          label: 'Your complaint',
          answer: 'tester content',
          human_value: 'tester content'
        }, {
          key: 'complaint_location',
          label: 'Court or tribunal your complaint is about',
          answer: '101',
          human_value: 'Aberdeen Employment Tribunal'
        }
      ]
    }
  ]
}

const payload = {
  title: '1786c427-246e-4bb7-90b9-a2e6cfae003f / Tue, 08 Oct 2019 12:44:33 GMT',
  sectionHeading: '(Optional) Some section heading',
  heading: 'Complain about a court or tribunal',
  columns: 'full',
  isPdf: true,
  skipRedact: true,
  components: [
    {
      _id: 'page.summary.answers',
      _type: 'answers',
      hideChangeAction: true,
      onlyShowCompletedAnswers: false,
      answersList: [
        {
          heading: 'Whats your name',
          summaryHeading: 'WIP',
          repeatable: undefined,
          level: 2
        }, {
          answers: [
            {
              page: 'page.name',
              component: 'first_name',
              key: {
                text: 'First name'
              },
              value: {
                text: 'Bob',
                machine: 'Bob'
              }
            },
            {
              page: 'page.name',
              component: 'last_name',
              key: {
                text: 'Last name'
              },
              value: {
                text: 'Smith',
                machine: 'Smith'
              }
            }
          ]
        }, {
          answers: [
            {
              page: 'page.email-address',
              component: 'email_address',
              key: {
                text: 'Your email address',
                machine: 'Your email address'
              },
              value: {
                text: 'bob.smith@gov.uk',
                machine: 'bob.smith@gov.uk'
              }
            },
            {
              page: 'page.complaint',
              component: 'complaint_details',
              key: {
                text: 'Your complaint'
              },
              value: {
                text: 'tester content',
                machine: 'tester content'
              }
            },
            {
              page: 'page.location',
              component: 'complaint_location',
              key: {
                text: 'Court or tribunal your complaint is about'
              },
              value: {
                text: 'Aberdeen Employment Tribunal',
                machine: '101'
              }
            }
          ]
        }
      ]
    }
  ]
}

test('creates a presentable payload', function (t) {
  t.deepEqual(pdfPayload(payload), expectedPayload, 'it should present the formbuilder payload')
  t.end()
})
