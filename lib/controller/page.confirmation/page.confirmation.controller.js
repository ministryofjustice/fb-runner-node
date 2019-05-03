const ConfirmationController = {}

ConfirmationController.setContents = (pageInstance, userData, res) => {
  // TODO: make user-session handle this
  if (res) {
    res.cookie('sessionId', '', {
      httpOnly: true,
      secure: false,
      cookiePath: '/',
      maxAge: 0
    })
  }
  return pageInstance
}

module.exports = ConfirmationController
