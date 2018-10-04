const uuidv4 = require('uuid/v4')
const crypto = require('crypto')

const external = {}

external.createUserId = () => {
  return uuidv4()
}

external.createUserToken = () => {
  return crypto.randomBytes(256).toString('hex')
}

external.createUserDigest = (userId, userToken, serviceToken) => {
  const hash = crypto.createHmac('sha256', serviceToken)
    .update(userId + userToken)
    .digest('hex')
  return hash
}

external.validateUserDigest = (userId, userToken, userDigest, serviceToken) => {
  const digestCheck = external.createUserDigest(userId, userToken, serviceToken)
  return digestCheck === userDigest
}

module.exports = external
