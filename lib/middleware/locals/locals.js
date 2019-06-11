const locals = (ENV, env, assetPath, govukFrontendVersion) => {
  assetPath = `/${assetPath}/`
  return (req, res, next) => {
    res.locals.asset_path = assetPath
    res.locals.ENV = ENV
    res.locals.env = env
    res.locals.govuk_frontend_version = govukFrontendVersion
    if (env.ENVIRONMENT_DISPLAY) {
      res.locals.environmentDisplay = env.ENVIRONMENT_DISPLAY
    }
    req.ENV = ENV
    req.env = env
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    req.forwardedProtocol = protocol
    req.servername = `${protocol}://${req.headers.host}`
    next()
  }
}

module.exports = {
  init: locals
}
