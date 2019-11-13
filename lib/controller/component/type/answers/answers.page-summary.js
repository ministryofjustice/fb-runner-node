const striptags = require('striptags')

const get = require('lodash.get')

const {
  getInstance,
  getInstanceTitleSummary,
  getInstanceProperty,
  getInstanceByPropertyValue
} = require('../../../../service-data/service-data')

const {
  getNextPage
} = require('../../../../route/route')

const {
  skipPage,
  setControlNames,
  skipComponents,
  setRepeatable,
  getDisplayValue
} = require('../../../../page/page')

const {format} = require('../../../../format/format')

const getRepeatableActions = require('./repeatable-actions/repeatable-actions')

const {
  isCurrentPageInstance,

  hasQuestions,
  hasMultipleQuestions,

  formatSectionHeading,

  getQuestionText,
  getHeadingText,

  getSubsequentPage,

  getQuestionInstances,

  getAnswerKey,
  getAnswerValue,
  getChangeHref,
  getChangeText,
  getVisuallyHiddenText,

  createAnswerBucket,

  populateParentDeletableAnswers,
  populateParentAddableAnswers,
  populateParentRepeatableHeadingAnswers,
  populateRepeatableHeadingAnswers,

  populateStepAddAnswers,
  populateStepRemoveAnswers
} = require('./answers.common')

// eslint-disable-next-line
const filterAnswers = (answer) => Reflect.has(answer, 'heading') || (Reflect.has(answer, 'answers') && answer.answers.length)

function reduceHeadings (accumulator, answer, index, array) {
  if (answer.heading) {
    if (index + 1 === array.length) { // Skip trailing headers
      return accumulator
    }

    const previousItem = accumulator[index - 1]

    if (previousItem && previousItem.level === answer.level) {
      accumulator.pop()
    }
  }

  return accumulator.concat(answer)
}

function getPageSummaryAnswers ({hideChangeAction = false, onlyShowCompletedAnswers = false}, userData, pageInstance) {
  const visitedPages = userData.getUserDataProperty('visited', [], 'visited')

  let currentPage

  if (pageInstance.summaryOf) {
    currentPage = getNextPage({
      _id: pageInstance.summaryOf, params: {}
    }, userData)
  } else {
    currentPage = {
      _id: getInstanceByPropertyValue('url', '/')._id
    }
  }

  let answers = []

  if (!isCurrentPageInstance(currentPage, pageInstance)) {
    let answerBucket = createAnswerBucket(answers)

    let previousInstance = {}
    let currentInstance = {}

    while (currentPage) {
      const currentPageId = currentPage._id

      if (onlyShowCompletedAnswers) {
        if (visitedPages.some(({_id}) => _id === currentPageId)) {
          /*
           *  Set aside as the previous component instance
           */
          previousInstance = currentInstance

          /*
           *  Onward to the next page!
           */
          currentPage = getSubsequentPage(currentPage, userData, pageInstance)
          continue
        }
      }

      const currentPageParams = currentPage.params

      currentInstance = getInstance(currentPageId)

      const currentInstanceId = currentInstance._id

      let level = 2

      if (currentInstance.namePrefix) {
        currentInstance.namePrefix = format(currentInstance.namePrefix, currentPageParams, {markdown: false})
      }

      if (currentInstance.heading) {
        currentInstance.heading = formatSectionHeading(userData, currentInstance.heading, currentPageParams)
      }

      currentInstance = setRepeatable(setControlNames(skipPage(currentInstance, userData), userData), userData)

      if (!currentInstance.$skipPage) {
        currentInstance = skipComponents(currentInstance, userData)

        /*
         *  If the current component instance is repeatable,
         *  populate the `answers` collection with the `stepRemove` action
         *
         *  `stepAdd` is down below
         */
        if (currentInstance.repeatable) {
          const {
            stepRemove
          } = getRepeatableActions(currentInstance, userData)

          if (populateStepRemoveAnswers(stepRemove)) {
            answerBucket = createAnswerBucket(answers)
          }
        }

        /*
         *  This is very involved, soz
         */
        const previousInstanceId = previousInstance._id
        const currentSectionHeading = getInstanceProperty(currentInstanceId, ['sectionHeadingSummary', 'sectionHeading'])
        const previousSectionHeading = getInstanceProperty(previousInstanceId, ['sectionHeadingSummary', 'sectionHeading'])

        if (currentSectionHeading) {
          const formattedCurrentSectionHeading = formatSectionHeading(userData, currentSectionHeading, currentInstance.params)
          const formattedPreviousSectionHeading = formatSectionHeading(userData, previousSectionHeading, previousInstance.params)

          if (formattedCurrentSectionHeading !== formattedPreviousSectionHeading) {
            answers.push({
              heading: formattedCurrentSectionHeading,
              level
            })

            answerBucket = createAnswerBucket(answers)
          }

          level++
        } else { // !currentSectionHeading
          if (previousSectionHeading) {
            answerBucket = createAnswerBucket(answers)
          }
        }

        /*
         *  Get the questions from the current component instance
         */
        const questionInstances = getQuestionInstances(currentInstance, userData)

        /*
         *  Prepare the page heading
         *
         *  This variable `pageHeading` is scoped for the iteration over
         *  `questionInstances` below.
         *
         *  It would be nice to pull this out into a function but it's
         *  a bit ... eesh
         */
        let pageHeading

        if (currentInstance._type !== 'page.singlequestion') {
          pageHeading = getInstanceTitleSummary(currentInstanceId)

          if (hasQuestions(questionInstances)) {
            if (!pageHeading) {
              const component = get(currentInstance, 'components[0]')
              if (component) {
                pageHeading = component.heading
              }
            }

            if (pageHeading) {
              pageHeading = getHeadingText(userData, currentInstance)

              answers.push({
                heading: pageHeading,
                repeatable: currentInstance.repeatable || false,
                level: level++
              })

              answerBucket = createAnswerBucket(answers)
            }
          }
        }

        /*
         *  Iterate over the questions for the current component instance
         */
        questionInstances.forEach(questionInstance => {
          if (populateParentDeletableAnswers(questionInstance, answers)) {
            answerBucket = createAnswerBucket(answers)
          }

          if (populateParentRepeatableHeadingAnswers(questionInstance, answers, level)) {
            answerBucket = createAnswerBucket(answers)
          }

          if (populateRepeatableHeadingAnswers(questionInstance, pageHeading, answers, level)) {
            answerBucket = createAnswerBucket(answers)
          }

          const {name} = questionInstance
          const questionText = getQuestionText(userData, questionInstance)
          const displayValue = getDisplayValue(pageInstance, userData, questionInstance)
          const value = name ? userData.getUserDataProperty(name) : striptags(displayValue)

          answerBucket.push({
            page: currentInstanceId,
            component: name,
            key: getAnswerKey(questionText),
            value: getAnswerValue(displayValue, value),
            ...( // eslint-disable-line
              hideChangeAction
                ? {}
                : {
                  actions: {
                    items: [
                      {
                        href: getChangeHref(currentPage, currentInstance, userData, pageInstance),
                        text: getChangeText(userData),
                        visuallyHiddenText: getVisuallyHiddenText(userData, questionInstance)
                      }
                    ]
                  }
                })
          })

          if (populateParentAddableAnswers(questionInstance, answers, currentInstance)) {
            answerBucket = createAnswerBucket(answers)
          }
        })

        /*
         *  If the current component instance is repeatable,
         *  populate the `answers` collection with the `stepAdd` action
         *
         *  `stepRemove` is up above
         */
        if (currentInstance.repeatable) {
          const {
            stepAdd
          } = getRepeatableActions(currentInstance, userData)

          if (populateStepAddAnswers(stepAdd, answers)) {
            answerBucket = createAnswerBucket(answers)
          }
        }

        /*
         *  Prepare for the next iteration
         */
        if (hasMultipleQuestions(questionInstances)) {
          answerBucket = createAnswerBucket(answers)
        }
      }

      /*
       *  Set aside as the previous component instance
       */
      previousInstance = currentInstance

      /*
       *  Onward to the next page!
       */
      currentPage = getSubsequentPage(currentPage, userData, pageInstance)
    }
  }

  /*
   *  Either the answer has a heading or it has (one or more) answers
   */
  answers = answers.filter(filterAnswers)

  if (onlyShowCompletedAnswers) {
    answers = answers.reduce(reduceHeadings, [])
  }

  return answers
}

module.exports = {
  filterAnswers,
  reduceHeadings,
  getPageSummaryAnswers
}
