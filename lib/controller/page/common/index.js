module.exports = class CommonController {
  async preFlight (pageInstance) { return pageInstance }

  async setContents (pageInstance) { return pageInstance }

  async postValidation (pageInstance) { return pageInstance }

  async preUpdateContents (pageInstance) { return pageInstance }

  async preRender (pageInstance) { return pageInstance }
}
