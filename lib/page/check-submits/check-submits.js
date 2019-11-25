require('@ministryofjustice/module-alias/register-module')(module)

const {getNextPage} = require('~/fb-runner-node/route/route')
const {getInstanceProperty} = require('~/fb-runner-node/service-data/service-data')

const checkSubmits = (pageInstance, userData) => {
  const nextPage = getNextPage({_id: pageInstance._id, params: userData.getUserParams()}, userData)
  // Check page actually submits
  if (!nextPage) {
    return false
  }
  const nextType = getInstanceProperty(nextPage._id, '_type')
  return nextType === 'page.confirmation'
}

module.exports = {
  checkSubmits
}
