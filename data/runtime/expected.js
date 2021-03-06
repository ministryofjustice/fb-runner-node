module.exports = {
  sourceInstances: {
    _type: 'sourceInstances',
    data: {
      source1: {
        pageConfirmation: {
          _id: 'pageConfirmation',
          _type: 'page.confirmation',
          url: '/confirmation',
          heading: 'Thank you',
          body: 'Your message is:\n\n**{greeting} {planet}**'
        },
        pageGreeting: {
          _id: 'pageGreeting',
          _type: 'page.singlequestion',
          url: '/greeting',
          components: [
            {
              _id: 'pageGreeting--greeting',
              _type: 'radios',
              name: 'greeting',
              label: 'What greeting would you like to use?',
              items: [
                {
                  _id: 'pageGreeting--greeting--hello',
                  _type: 'radio',
                  value: 'Hello',
                  label: 'Hello'
                },
                {
                  _id: 'pageGreeting--greeting--hi',
                  _type: 'radio',
                  value: 'Hi',
                  label: 'Hi'
                },
                {
                  _id: 'pageGreeting--greeting--hurry',
                  _type: 'radio',
                  value: 'Hello World',
                  label: 'Just give me a basic Hello World'
                }
              ]
            }
          ]
        },
        pagePlanet: {
          _id: 'pagePlanet',
          _type: 'page.singlequestion',
          url: '/planet',
          components: [
            {
              _id: 'pagePlanet--planet',
              _type: 'text',
              name: 'planet',
              label: 'What is your favourite planet?'
            }
          ],
          show: {
            identifier: 'greeting',
            operator: 'is',
            value: 'Hello World',
            negated: true
          }
        },
        pageStartExample: {
          _id: 'pageStartExample',
          _type: 'page.start',
          url: '/',
          heading: 'Create a hello world message',
          body: 'You can create a greeting for your favourite planet.\n\nIf you’re in a hurry or don’t have a favourite planet, you can ask for a basic hello world message.',
          steps: ['pageGreeting', 'pagePlanet', 'pageConfirmation']
        }
      }
    }
  }
}
