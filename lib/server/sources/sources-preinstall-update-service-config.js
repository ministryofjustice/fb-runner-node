const path = require('path')
const {writeFileSync} = require('fs')
const loadJson = require('load-json-file').sync

const updateServiceConfig = (serviceConfigPath, COMPONENTS_MODULE) => {
  // update service config if needed
  // NB. this can be removed once https://github.com/ministryofjustice/fb-service-starter/pull/2 has been merged
  const serviceConfigFilePath = path.join(serviceConfigPath, 'service.json')
  const serviceConfig = loadJson(serviceConfigFilePath)
  if (!serviceConfig._isa) {
    serviceConfig._isa = `${COMPONENTS_MODULE}=>service`
    writeFileSync(serviceConfigFilePath, JSON.stringify(serviceConfig, null, 2))
  }
}

module.exports = updateServiceConfig
