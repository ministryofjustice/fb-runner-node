/* eslint-disable no-unused-vars */
const test = require('tape')
const {removeUnnecessaryHeadings} = require('./answers.controller')

const answers = {answers: true}
const heading = {heading: true, level: 33}
const headingLevel34 = {heading: true, level: 34}

test('When there are no headings', t => {
  const singleAnswer = [answers]
  const singleResult = removeUnnecessaryHeadings(singleAnswer)
  t.deepEqual(singleResult, singleAnswer, 'it leave a single answer untouched')

  const manyAnswers = [answers, answers, answers]
  const multipleResult = removeUnnecessaryHeadings(manyAnswers)
  t.deepEqual(multipleResult, manyAnswers, 'it should leave many answers untouched')

  t.end()
})

test('When there is a trailing heading', t => {
  const input = [answers, heading]
  const result = removeUnnecessaryHeadings(input)
  const expected = [answers]

  t.deepEqual(result, expected, 'it should remove the trailing heading')
  t.end()
})

test('When there are multiple headings', t => {
  const input = [answers, heading, heading, heading]
  const result = removeUnnecessaryHeadings(input)
  const expected = [answers, heading]

  t.deepEqual(result, expected, 'it should remove multiple headings')
  t.end()
})

test('When there are headings of different levels', t => {
  const input = [answers, headingLevel34, heading, headingLevel34, heading]
  const result = removeUnnecessaryHeadings(input)
  const expected = [answers, headingLevel34, heading, headingLevel34]
  t.deepEqual(result, expected, 'it should not treat them as duplicates')
  t.end()
})
