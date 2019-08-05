const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const performOnlineCheckStub = stub()
performOnlineCheckStub.callsFake(async () => {})
const ensureGitIgnoreExistsStub = stub()
const cleanupGeneratedFilesStub = stub()
const updateServiceConfigStub = stub()
const ensurePackageStub = stub()

const preinstallSources = proxyquire('./sources-preinstall', {
  './preinstall/sources-preinstall-online-check': performOnlineCheckStub,
  './preinstall/sources-preinstall-ensure-gitignore': ensureGitIgnoreExistsStub,
  './preinstall/sources-preinstall-cleanup-generated-files': cleanupGeneratedFilesStub,
  './preinstall/sources-preinstall-update-service-config': updateServiceConfigStub,
  './preinstall/sources-preinstall-ensure-package': ensurePackageStub
})

test('When performing preinstallation tasks for the service sources', async t => {
  await preinstallSources({
    PLATFORM_ENV: 'platform_env',
    COMPONENTS_MODULE: 'components_modules',
    COMPONENTS_VERSION: 'components_version',
    servicePackagePath: 'service_package_path',
    serviceConfigPath: 'service_config_path',
    servicePackageLockPath: 'service_package_lock_path',
    serviceNodeModulesPath: 'service_node_modules_path',
    resolvedServicePath: 'resolved_service_path'
  })

  t.ok(performOnlineCheckStub.calledOnce, 'it should perform the online check once')
  t.deepEqual(performOnlineCheckStub.getCall(0).args, ['service_package_path', 'service_node_modules_path', 'platform_env'], 'it should pass the expected args to performOnlineCheck')

  t.ok(ensureGitIgnoreExistsStub.calledOnce, 'it should ensure a .gitgnore file exists once')
  t.deepEqual(ensureGitIgnoreExistsStub.getCall(0).args, ['resolved_service_path'], 'it should pass the expected args to ensureGitIgnoreExists')

  t.ok(cleanupGeneratedFilesStub.calledOnce, 'it should call the cleanup hook code once')
  t.deepEqual(cleanupGeneratedFilesStub.getCall(0).args, ['service_package_path', 'service_package_lock_path'], 'it should pass the expected args to cleanupGeneratedFiles')

  t.ok(updateServiceConfigStub.calledOnce, 'it should perform any required updattes to service config once')
  t.deepEqual(updateServiceConfigStub.getCall(0).args, ['service_config_path', 'components_modules'], 'it should pass the expected args to updateServiceConfig')

  t.ok(ensurePackageStub.calledOnce, 'it should ensure a package file exists once')
  t.deepEqual(ensurePackageStub.getCall(0).args, ['service_package_path', 'components_modules', 'components_version'], 'it should pass the expected args to ensurePackage')

  t.end()
})
