const express = require('express')
const router = express.Router()

const json2csv = require('json2csv').parse
const flatten = require('flat')

const useAsync = require('../use-async/use-async')
const {getInstanceProperty} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const generateOutput = async (req, res) => {
  const {outputType, outputId, destination, filename} = req.params

  if (outputId !== 'default') {
    throw new Error(404)
  }

  const userData = req.user
  if (outputType === 'csv') {
    const jsonData = flatten(userData.getOutputData())
    const outputData = {}
    Object.keys(jsonData).reverse().forEach(key => {
      let normalisedKey = key
      if (key.match(/\b\d+\b/)) {
        const adjustedKey = key.replace(/\b(\d+)\b/g, (m, m1) => {
          return 1 + Number(m1)
        })
        normalisedKey = adjustedKey
      }
      outputData[normalisedKey] = jsonData[key]
    })
    const fields = Object.keys(outputData).reverse()

    const csvOutput = json2csv(outputData, {fields})
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
    res.write(csvOutput)
    res.end()
  } else {
    throw new Error(404)
  }
}

// Convenience route to generate output for current user
router.use('/:outputType/:outputId/:destination?/:filename', useAsync(async (req, res) => {
  // Only allow unforwarded requests access
  if (req.get('x-forwarded-host')) {
    throw new Error(404)
  }
  await generateOutput(req, res)
}))

const routesOutput = (options = {}) => {
  return router
}

module.exports = {
  init: routesOutput
}
