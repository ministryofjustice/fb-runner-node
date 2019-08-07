const {getNextPage} = require('../../route/route')
const {getInstanceProperty} = require('../../service-data/service-data')

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
