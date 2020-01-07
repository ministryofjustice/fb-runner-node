#!/usr/bin/env node

const glob = require('glob-promise')
const fs = require('fs')

const jsonlint = require('jsonlint')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')

const getComponentsPath = require('./get-components-path')

FBLogger.verbose(true)

const componentsPath = getComponentsPath()

const errors = []

const testJSON = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    fs.readFile(file, {encoding: 'utf8'}, (err, jsonContent) => {
      if (err) {
        errors.push(`Could not open file - ${file}`)
      } else {
        try {
          jsonlint.parse(jsonContent)

          if (options._name) {
            const json = JSON.parse(jsonContent)
            if (json._name !== file.replace(/.*\/([^/]+)\.schema\.json$/, '$1')) {
              errors.push([`Non-matching _name - ${file}`, `_name (${json._name}) does not match source filename`].join('\n'))
            }
          }

          if (options._id) {
            const json = JSON.parse(jsonContent)
            if (json._id !== file.replace(/.*\/([^/]+)\.json$/, '$1')) {
              errors.push([`Non-matching _id - ${file}`, `_id (${json._id}) does not match source filename`].join('\n'))
            }
          }
        } catch (e) {
          errors.push([`Invalid json file - ${file}`, e.toString()].join('\n'))
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
    if (errors.length) {
      FBLogger(errors.join('\n\n'))
      process.exit(1)
    } else {
      FBLogger('OK')
    }
  })
