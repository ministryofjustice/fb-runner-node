const signin = (userData) => {
// record user signed in
  userData.setUserDataProperty('authenticated', true)
  // log user signed in
  const history = userData.setUserDataProperty('history') || []
  history.push(Date.now())
}

const signout = (userData) => {
  userData.unsetUserDataProperty('authenticated')
}

module.exports = {
  signin,
  signout
}
