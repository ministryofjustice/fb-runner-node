const locals = (ENV, env, assetPath, locals) => {
  assetPath = `/${assetPath}/`
  const localsBundle = Object.assign({
    asset_path: assetPath,
    ENV,
    env
  }, locals)
  if (env.ENVIRONMENT_DISPLAY) {
    localsBundle.environmentDisplay = env.ENVIRONMENT_DISPLAY
  }
  return (req, res, next) => {
    res.locals = Object.assign(res.locals, localsBundle)
    req.ENV = ENV
    req.env = env
    const protocol = req.get('x-forwarded-proto') || req.protocol
    req.forwardedProtocol = protocol
    req.servername = `${protocol}://${req.headers.host}`
    next()
  }
}

module.exports = {
  init: locals
}
