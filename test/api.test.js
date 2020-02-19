const test = require('ava')
const sinon = require('sinon')
const fs = require('fs')
const api = require('../src/api')
const error = require('../src/error')

const validVersion = '0.0.0'
const invalidVersion = 'asdf'

const validBumpType = api.bumpType.patch
const invalidBumpType = 'No Change'

const psettingsWithValidVersion = `  bundleVersion: ${validVersion}`
const psettingsWithInvalidVersion = `  bundleVersion: ${invalidVersion}`

const psettingsWithName = '  productName: asdf'
const psettingsWithoutName = ''

const emptyJson = {}
const jsonWithDeps = { dependencies: { foo: '2.1.4', bar: '0.5.8' } }
const jsonWithDepsAlternateVersions = { dependencies: { foo: '3.0.0', bar: '0.5.4' } }
const jsonWithDepsAlternatePackage = { dependencies: { baz: '10.0.6' } }
const jsonWithVersion = { version: '1.0.0' }

test('versionIsValid: returns false if invalid version', t => {
  t.is(api.versionIsValid(invalidVersion), false)
})

test('versionIsValid: returns true if valid version', t => {
  t.is(api.versionIsValid(validVersion), true)
})

test('bumpTypeIsValid: returns false if invalid bump type', t => {
  t.is(api.bumpTypeIsValid(invalidBumpType), false)
})

test('bumpTypeIsValid: returns true if valid bump type', t => {
  t.is(api.bumpTypeIsValid(api.bumpType.patch), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.patch} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.patch.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.patch.toLowerCase()), true)

  t.is(api.bumpTypeIsValid(api.bumpType.minor), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.minor} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.minor.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.minor.toLowerCase()), true)

  t.is(api.bumpTypeIsValid(api.bumpType.major), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.major} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.major.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.major.toLowerCase()), true)

  t.is(api.bumpTypeIsValid(api.bumpType.prepatch), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.prepatch} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.prepatch.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.prepatch.toLowerCase()), true)

  t.is(api.bumpTypeIsValid(api.bumpType.preminor), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.preminor} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.preminor.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.preminor.toLowerCase()), true)

  t.is(api.bumpTypeIsValid(api.bumpType.premajor), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.premajor} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.premajor.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.premajor.toLowerCase()), true)

  t.is(api.bumpTypeIsValid(api.bumpType.prerelease), true)
  t.is(api.bumpTypeIsValid(` ${api.bumpType.prerelease} `), true)
  t.is(api.bumpTypeIsValid(api.bumpType.prerelease.toUpperCase()), true)
  t.is(api.bumpTypeIsValid(api.bumpType.prerelease.toLowerCase()), true)
})

test(`bumpVersion: throws ${error.InvalidVersionError.name} if invalid version`, t => {
  t.throws(
    () => api.bumpVersion(invalidVersion, validBumpType),
    { instanceOf: error.InvalidVersionError }
  )
})

test(`bumpVersion: throws ${error.InvalidBumpTypeError.name} if invalid bump type`, t => {
  t.throws(
    () => api.bumpVersion(validVersion, invalidBumpType),
    { instanceOf: error.InvalidBumpTypeError }
  )
})

test('bumpVersion: returns bumped version if valid version', t => {
  t.is(api.bumpVersion(validVersion, api.bumpType.patch), '0.0.1')
  t.is(api.bumpVersion(validVersion, api.bumpType.minor), '0.1.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.major), '1.0.0')

  t.is(api.bumpVersion(validVersion, api.bumpType.prepatch), '0.0.1-prerelease.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.preminor), '0.1.0-prerelease.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.premajor), '1.0.0-prerelease.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.prerelease), '0.0.1-prerelease.0')

  t.is(api.bumpVersion(validVersion, api.bumpType.prepatch, 'alpha'), '0.0.1-alpha.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.preminor, 'beta'), '0.1.0-beta.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.premajor, 'gamma'), '1.0.0-gamma.0')
  t.is(api.bumpVersion(validVersion, api.bumpType.prerelease, 'zeta'), '0.0.1-zeta.0')
})

test(`getPackageName: throws ${error.PackageDisplayNameParseError.name} if package name does not exist`, t => {
  t.throws(
    () => api.getPackageName({}),
    { instanceOf: error.PackageDisplayNameParseError }
  )
})

test('getPackageName: returns package name if package name exists', t => {
  t.is(api.getPackageName({ displayName: 'asdf' }), 'asdf')
})

test(`getPackageVersion: throws ${error.PackageVersionParseError.name} if version does not exist`, t => {
  t.throws(
    () => api.getPackageVersion({}),
    { instanceOf: error.PackageVersionParseError }
  )
})

test(`getPackageVersion: throws ${error.InvalidVersionError.name} if invalid version`, t => {
  t.throws(
    () => api.getPackageVersion({ version: invalidVersion }),
    { instanceOf: error.InvalidVersionError }
  )
})

test('getPackageVersion: returns package version if valid package version exists', t => {
  t.is(api.getPackageVersion({ version: validVersion }), validVersion)
})

test(`getProjectVersion: throws ${error.ProjectVersionParseError.name} if version does not exist`, t => {
  t.throws(
    () => api.getProjectVersion(''),
    { instanceOf: error.ProjectVersionParseError }
  )
})

test(`getProjectVersion: throws ${error.InvalidVersionError.name} if invalid version`, t => {
  t.throws(
    () => api.getProjectVersion(psettingsWithInvalidVersion),
    { instanceOf: error.InvalidVersionError }
  )
})

test('getProjectVersion: returns project version if valid project version exists', t => {
  t.is(api.getProjectVersion(psettingsWithValidVersion), validVersion)
})

test(`getManifest: throws ${error.MissingManifestError.name} if manifest does not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => false)

  t.throws(
    () => api.getManifest('asdf/manifest.json'),
    { instanceOf: error.MissingManifestError }
  )

  sandbox.restore()
})

test('getManifest: returns manifest contents if it exists', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => true)
  sandbox.stub(fs, 'readFileSync').callsFake(() => '{}')

  t.deepEqual(api.getManifest('asdf/test/manifest.json'), {})

  sandbox.restore()
})

test(`getProjectSettings: throws ${error.MissingProjectSettingsError.name} if project settings do not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => false)
  sandbox.stub(fs, 'readFileSync').callsFake(() => 'yaml')

  t.throws(
    () => api.getProjectSettings('asdf/ProjectSettings.asset'),
    { instanceOf: error.MissingProjectSettingsError }
  )

  sandbox.restore()
})

test('getProjectSettings: returns contents of project settings if they exist', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => true)
  sandbox.stub(fs, 'readFileSync').callsFake(() => 'yaml')

  t.is(api.getProjectSettings('asdf/ProjectSettings.asset'), 'yaml')

  sandbox.restore()
})

test(`getProjectName: throws ${error.ProjectProductNameParseError.name} if name does not exist`, t => {
  t.throws(
    () => api.getProjectName(psettingsWithoutName),
    { instanceOf: error.ProjectProductNameParseError }
  )
})

test('getProjectName: returns project version if valid project version exists', t => {
  t.is(api.getProjectName(psettingsWithName), 'asdf')
})

test(`setProjectVersion: throws ${error.MissingProjectSettingsError.name} if project settings do not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => false)

  t.throws(
    () => api.setProjectVersion(validVersion, 'asdf/ProjectSettings.asset'),
    { instanceOf: error.MissingProjectSettingsError }
  )

  sandbox.restore()
})

test(`setProjectVersion: throws ${error.ProjectVersionParseError.name} if project version cannot be parsed`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => true)
  sandbox.stub(fs, 'readFileSync').callsFake(() => '%YAML 1.1\nPlayerSettings:\n  productName: YamlIsBad\n  bungleVersion: 0.1') // Note the 'g' in "bungleVersion."

  t.throws(
    () => api.setProjectVersion(validVersion, 'asdf/ProjectSettings.asset'),
    { instanceOf: error.ProjectVersionParseError }
  )

  sandbox.restore()
})

test(`setProjectVersion: throws ${error.InvalidVersionError.name} if project version is invalid`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => true)
  sandbox.stub(fs, 'readFileSync').callsFake(() => '%YAML 1.1\nPlayerSettings:\n  productName: YamlIsBad\n  bundleVersion: 0.1')

  t.throws(
    () => api.setProjectVersion(invalidVersion, 'asdf/ProjectSettings.asset'),
    { instanceOf: error.InvalidVersionError }
  )

  sandbox.restore()
})

test('setProjectVersion: writes to file if bump type and project settings are valid', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => true)
  sandbox.stub(fs, 'readFileSync').callsFake(() => '%YAML 1.1\nPlayerSettings:\n  productName: YamlIsBad\n  bundleVersion: 0.1')
  sandbox.stub(fs, 'writeFileSync').callsFake(() => 'Murder, She Wrote')

  api.setProjectVersion(validVersion, 'asdf/ProjectSettings.asset')

  t.is(fs.writeFileSync.called, true)

  sandbox.restore()
})

test(`getPackageSettings: throws ${error.MissingPackageSettingsError.name} if package settings do not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => false)
  sandbox.stub(fs, 'readFileSync').callsFake(() => '{}')

  t.throws(
    () => api.getPackageSettings('asdf/package.json'),
    { instanceOf: error.MissingPackageSettingsError }
  )

  sandbox.restore()
})

test('getPackageSettings: returns contents of package settings if they exist', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(fs, 'existsSync').callsFake(() => true)
  sandbox.stub(fs, 'readFileSync').callsFake(() => '{}')

  t.deepEqual(api.getPackageSettings('asdf/package.json'), {})

  sandbox.restore()
})

test(`hasPackageDepsToSync: throws ${error.MissingPackageSettingsError.name} if package settings do not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'hasPackageSettings').callsFake(() => false)
  sandbox.stub(api, 'hasManifest').callsFake(() => true)

  t.throws(
    () => api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'),
    { instanceOf: error.MissingPackageSettingsError }
  )

  sandbox.restore()
})

test(`hasPackageDepsToSync: throws ${error.MissingManifestError.name} if project manifest does not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => emptyJson)
  sandbox.stub(api, 'hasManifest').callsFake(() => false)

  t.throws(
    () => api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'),
    { instanceOf: error.MissingManifestError }
  )

  sandbox.restore()
})

test('hasPackageDepsToSync: returns false if package settings have no \'dependencies\' property', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => emptyJson)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDeps)

  t.is(api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'), false)

  sandbox.restore()
})

test('hasPackageDepsToSync: returns false if manifest has no \'dependencies\' property', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => emptyJson)

  t.is(api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'), false)

  sandbox.restore()
})

test('hasPackageDepsToSync: returns false if no package settings \'dependencies\' key is in manifest', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDepsAlternatePackage)

  t.is(api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'), false)

  sandbox.restore()
})

test('hasPackageDepsToSync: returns false if shared \'dependencies\' keys between package settings and manifest are equal', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDeps)

  t.is(api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'), false)

  sandbox.restore()
})

test('hasPackageDepsToSync: returns true if shared \'dependencies\' keys between package settings and manifest differ', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDepsAlternateVersions)

  t.is(api.hasPackageDepsToSync('asdf/package.json', 'asdf/manifest.json'), true)

  sandbox.restore()
})

test(`syncPackageDeps: throws ${error.MissingPackageSettingsError.name} if package settings do not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'hasPackageSettings').callsFake(() => false)
  sandbox.stub(api, 'hasManifest').callsFake(() => true)

  t.throws(
    () => api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json'),
    { instanceOf: error.MissingPackageSettingsError }
  )

  sandbox.restore()
})

test(`syncPackageDeps: throws ${error.MissingManifestError.name} if project manifest does not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => emptyJson)
  sandbox.stub(api, 'hasManifest').callsFake(() => false)

  t.throws(
    () => api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json'),
    { instanceOf: error.MissingManifestError }
  )

  sandbox.restore()
})

test('syncPackageDeps: does not write to file if package settings have no \'dependencies\' property', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => emptyJson)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDeps)
  sandbox.spy(fs, 'writeFileSync')

  api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json')

  t.is(fs.writeFileSync.called, false)

  sandbox.restore()
})

test('syncPackageDeps: does not write to file if manifest has no \'dependencies\' property', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => emptyJson)
  sandbox.spy(fs, 'writeFileSync')

  api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json')

  t.is(fs.writeFileSync.called, false)

  sandbox.restore()
})

test('syncPackageDeps: does not write to file if no package settings \'dependencies\' key is in manifest', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDepsAlternatePackage)
  sandbox.spy(fs, 'writeFileSync')

  api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json')

  t.is(fs.writeFileSync.called, false)

  sandbox.restore()
})

test('syncPackageDeps: does not write to file if shared \'dependencies\' keys between package settings and manifest are equal', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDeps)
  sandbox.spy(fs, 'writeFileSync')

  api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json')

  t.is(fs.writeFileSync.called, false)

  sandbox.restore()
})

test('syncPackageDeps: writes to file if shared \'dependencies\' keys between package settings and manifest differ', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithDeps)
  sandbox.stub(api, 'getManifest').callsFake(() => jsonWithDeps)
  sandbox.stub(fs, 'writeFileSync').callsFake(() => 'Murder, She Wrote')

  api.syncPackageDeps('asdf/package.json', 'asdf/manifest.json')

  t.is(fs.writeFileSync.called, false)

  sandbox.restore()
})

test(`setPackageVersion: throws ${error.MissingPackageSettingsError.name} if package settings do not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'hasPackageSettings').callsFake(() => false)

  t.throws(
    () => api.setPackageVersion(validVersion, 'asdf/package.json'),
    { instanceOf: error.MissingPackageSettingsError }
  )

  sandbox.restore()
})

test(`setPackageVersion: throws ${error.PackageVersionParseError.name} if package version does not exist`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => emptyJson)

  t.throws(
    () => api.setPackageVersion(validVersion, 'asdf/package.json'),
    { instanceOf: error.PackageVersionParseError }
  )

  sandbox.restore()
})

test(`setPackageVersion: throws ${error.InvalidVersionError.name} if package version is invalid`, t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithVersion)

  t.throws(
    () => api.setPackageVersion(invalidVersion, 'asdf/package.json'),
    { instanceOf: error.InvalidVersionError }
  )

  sandbox.restore()
})

test('setPackageVersion: writes to file if bump type and package settings exist and are valid', t => {
  const sandbox = sinon.createSandbox()

  sandbox.stub(api, 'getPackageSettings').callsFake(() => jsonWithVersion)
  sandbox.stub(fs, 'writeFileSync').callsFake(() => 'Murder, She Wrote')

  api.setPackageVersion(validVersion, 'asdf/manifest.json')

  t.is(fs.writeFileSync.called, true)

  sandbox.restore()
})
