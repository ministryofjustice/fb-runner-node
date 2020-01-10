#!/usr/bin/env node

const glob = require('glob-promise')
const fs = require('fs')

const jsonlint = require('jsonlint')

const debug = require('debug')
const log = debug('runner:lint-schemas')
const error = debug('runner:lint-schemas')

const getComponentsPath = require('./get-components-path')

const componentsPath = getComponentsPath()

const jsonFileErrors = []

const testJSON = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, {encoding: 'utf8'}, (e, jsonContent) => {
      if (e) {
        jsonFileErrors.push(`Could not open file - ${file}`)
      } else {
        try {
          jsonlint.parse(jsonContent)

          if (options._name) {
            const json = JSON.parse(jsonContent)
            if (json._name !== file.replace(/.*\/([^/]+)\.schema\.json$/, '$1')) {
              jsonFileErrors.push([`Non-matching _name - ${file}`, `_name (${json._name}) does not match source filename`].join('\n'))
            }
          }

          if (options._id) {
            const json = JSON.parse(jsonContent)
            if (json._id !== file.replace(/.*\/([^/]+)\.json$/, '$1')) {
              jsonFileErrors.push([`Non-matching _id - ${file}`, `_id (${json._id}) does not match source filename`].join('\n'))
            }
          }
        } catch (e) {
          jsonFileErrors.push([`Invalid json file - ${file}`, e.toString()].join('\n'))
        }
      }

      resolve()
    })
  })
}

const testJSONFiles = (files, options) => Promise.all(files.map(file => testJSON(file, options)))

glob(`${componentsPath}/specifications/**/*/*.schema.json`)
  .then(files => testJSONFiles(files, {_name: true}))
  .then(() => glob(`${componentsPath}/specifications/**/data/**/*/*.json`))
  .then(testJSONFiles)
  .then(() => {
    if (jsonFileErrors.length) {
      error('Errors', jsonFileErrors.join('\n\n'))
      process.exit(1)
    } else {
      log('OK')
    }
  })
