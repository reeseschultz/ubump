const semver = require('semver')
const fs = require('fs')
const yaml = require('js-yaml')
const error = require('./error')

exports.bumpType = {
  patch: 'Patch',
  minor: 'Minor',
  major: 'Major',
  prepatch: 'Prepatch',
  preminor: 'Preminor',
  premajor: 'Premajor',
  prerelease: 'Prerelease'
}

/**
 * @param {string} path The fully qualified path to a file.
 */
exports.getDir = path =>
  path.substr(0, path.lastIndexOf('/'))

/**
 * @param {string} bumpType The bump type.
 */
exports.massageBumpType = bumpType =>
  bumpType.toLowerCase().trim()

/**
 * @param {string} version The version.
 */
exports.massageVersion = version =>
  semver.valid(version)

/**
 * @param {string} packagePath The path to the package.
 */
exports.massagePackagePath = packagePath => {
  if (packagePath.includes('package.json')) return packagePath
  packagePath += packagePath.endsWith('/') ? 'package.json' : '/package.json'
  return packagePath
}

/**
 * @param {string} projectPath The project directory path.
 */
exports.massageManifestPath = projectPath => {
  if (projectPath.includes('Packages/manifest.json')) return projectPath
  projectPath += projectPath.endsWith('/') ? 'Packages/manifest.json' : '/Packages/manifest.json'
  return projectPath
}

/**
 * @param {string} projectPath The project directory path.
 */
exports.massageProjectSettingsPath = projectPath => {
  if (projectPath.includes('ProjectSettings/ProjectSettings.asset')) return projectPath
  projectPath += projectPath.endsWith('/') ? 'ProjectSettings/ProjectSettings.asset' : '/ProjectSettings/ProjectSettings.asset'
  return projectPath
}

/**
 * @param {string} bumpType The bump type.
 */
exports.isPre = bumpType =>
  this.massageBumpType(bumpType) === this.massageBumpType(this.bumpType.prepatch) ||
  this.massageBumpType(bumpType) === this.massageBumpType(this.bumpType.preminor) ||
  this.massageBumpType(bumpType) === this.massageBumpType(this.bumpType.premajor) ||
  this.massageBumpType(bumpType) === this.massageBumpType(this.bumpType.prerelease)

/**
 * @param {string} version The version.
 */
exports.versionIsValid = version =>
  !!this.massageVersion(version)

/**
 * @param {string} version The version.
 */
exports.checkVersion = version => {
  if (!this.versionIsValid(version)) throw new error.InvalidVersionError()
}

/**
 * @param {string} bumpType The bump type.
 */
exports.bumpTypeIsValid = bumpType =>
  Object.keys(this.bumpType).some(expectedBumpType =>
    this.massageBumpType(bumpType) === this.massageBumpType(expectedBumpType)
  )

/**
 * @param {string} bumpType The bump type.
 */
exports.checkBumpType = bumpType => {
  if (!this.bumpTypeIsValid(bumpType)) throw new error.InvalidBumpTypeError()
}

/**
 * @param {string} version The version.
 * @param {string} bumpType The bump type.
 * @param {string} [preid] The prerelease identifier.
 */
exports.bumpVersion = (version, bumpType, preid) => {
  this.checkVersion(version)
  this.checkBumpType(bumpType)

  const massagedVersion = this.massageVersion(version)
  const massagedBumpType = this.massageBumpType(bumpType)

  if (this.isPre(massagedBumpType)) {
    preid = preid || 'prerelease'

    if (preid === 'prerelease') {
      const prereleaseComponents = semver.prerelease(massagedVersion)
      if (prereleaseComponents !== null) preid = prereleaseComponents[0]
    }

    return semver.inc(massagedVersion, massagedBumpType, preid)
  }

  return semver.inc(massagedVersion, massagedBumpType)
}

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.hasPackageName = pjson =>
  'displayName' in pjson

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.checkPackageName = pjson => {
  if (!this.hasPackageName(pjson)) throw new error.PackageDisplayNameParseError()
}

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.getPackageName = pjson => {
  this.checkPackageName(pjson)
  return pjson.displayName
}

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.hasUnfriendlyPackageName = pjson =>
  'name' in pjson

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.checkUnfriendlyPackageName = pjson => {
  if (!this.hasUnfriendlyPackageName(pjson)) throw new error.PackageNameParseError()
}

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.getUnfriendlyPackageName = pjson => {
  this.checkUnfriendlyPackageName(pjson)
  return pjson.name.split('.').pop()
}

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.hasPackageVersion = pjson =>
  'version' in pjson

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.checkPackageVersion = pjson => {
  if (!this.hasPackageVersion(pjson)) throw new error.PackageVersionParseError()
}

/**
 * @param {string} pjson The package settings (package.json) file as a string.
 */
exports.getPackageVersion = pjson => {
  this.checkPackageVersion(pjson)

  let { version } = pjson
  if (version.split('.').length < 3) version = semver.coerce(version).version

  this.checkVersion(version)
  return this.massageVersion(version)
}

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.getProjectVersionMatches = psettings =>
  psettings.match(/bundleVersion:\s*(.*)/)

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.hasProjectVersion = psettings => {
  const versionMatches = this.getProjectVersionMatches(psettings)
  return versionMatches !== null && Array.isArray(versionMatches) && versionMatches.length === 2
}

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.checkProjectVersion = psettings => {
  if (!this.hasProjectVersion(psettings)) throw new error.ProjectVersionParseError()
}

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.getProjectVersion = psettings => {
  this.checkProjectVersion(psettings)
  const versionMatches = this.getProjectVersionMatches(psettings)

  let version = versionMatches[1]
  if (version.split('.').length < 3) version = semver.coerce(version).version

  this.checkVersion(version)

  return this.massageVersion(version)
}

/**
 * @param {string} projectPath The project directory path.
 */
exports.hasManifest = projectPath =>
  fs.existsSync(this.massageManifestPath(projectPath))

/**
 * @param {string} projectPath The project directory path.
 */
exports.checkManifest = projectPath => {
  if (!this.hasManifest(this.massageManifestPath(projectPath))) throw new error.MissingManifestError()
}

/**
 * @param {string} projectPath The project directory path.
 */
exports.getManifest = projectPath => {
  this.checkManifest(this.massageManifestPath(projectPath))

  try {
    return JSON.parse(fs.readFileSync(projectPath, 'utf8'))
  } catch {
    throw new error.MissingManifestError()
  }
}

/**
 * @param {string} projectPath The project directory path.
 */
exports.hasProjectSettings = projectPath =>
  fs.existsSync(this.massageProjectSettingsPath(projectPath))

/**
 * @param {string} projectPath The project directory path.
 */
exports.checkProjectSettings = projectPath => {
  if (!this.hasProjectSettings(this.massageProjectSettingsPath(projectPath))) throw new error.MissingProjectSettingsError()
}

/**
 * @param {string} projectPath The project directory path.
 */
exports.getProjectSettings = projectPath => {
  this.checkProjectSettings(this.massageProjectSettingsPath(projectPath))

  try {
    return fs.readFileSync(this.massageProjectSettingsPath(projectPath), 'utf8')
  } catch {
    throw new error.MissingProjectSettingsError()
  }
}

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.getProjectNameMatches = psettings =>
  psettings.match(/productName:\s*(.*)/)

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.hasProjectName = psettings => {
  const projectNameMatches = this.getProjectNameMatches(psettings)
  return projectNameMatches !== null && Array.isArray(projectNameMatches) && projectNameMatches.length === 2
}

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.checkProjectName = psettings => {
  if (!this.hasProjectName(psettings)) throw new error.ProjectProductNameParseError()
}

/**
 * @param {string} psettings The project settings file as a string.
 */
exports.getProjectName = psettings => {
  this.checkProjectName(psettings)
  return this.getProjectNameMatches(psettings)[1]
}

/**
 * @param {string} version The version.
 * @param {string} projectPath The project directory path.
 */
exports.setProjectVersion = (version, projectPath) => {
  this.checkVersion(version)

  const massagedPath = this.massageProjectSettingsPath(projectPath)
  const psettings = this.getProjectSettings(massagedPath)

  this.checkProjectVersion(psettings)

  fs.writeFileSync(
    massagedPath,
    yaml.dump(
      psettings.replace(
        /\s\sbundleVersion:\s*.*/g,
                `  bundleVersion: ${version}`
      )
    ).split('\n').slice(1).map(str => str.replace(/\s\s/, '')).join('\n')
  )
}

/**
 * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
 */
exports.hasPackageSettings = packagePath =>
  fs.existsSync(this.massagePackagePath(packagePath))

/**
 * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
 */
exports.checkPackageSettings = packagePath => {
  if (!this.hasPackageSettings(this.massagePackagePath(packagePath))) throw new error.MissingPackageSettingsError()
}

/**
 * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
 */
exports.getPackageSettings = packagePath => {
  packagePath = this.massagePackagePath(packagePath)

  this.checkPackageSettings(packagePath)

  try {
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  } catch {
    throw new error.MissingPackageSettingsError()
  }
}

/**
 * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
 * @param {string} projectPath The project directory path.
 */
exports.hasPackageDepsToSync = (packagePath, projectPath) => {
  const pjson = this.getPackageSettings(this.massagePackagePath(packagePath))
  const manifest = this.getManifest(this.massageManifestPath(projectPath))

  if (!('dependencies' in pjson) || !('dependencies' in manifest)) return false

  return Object.keys(pjson.dependencies).some(key =>
    (key in manifest.dependencies) &&
        pjson.dependencies[key] !== manifest.dependencies[key]
  )
}

/**
 * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
 * @param {string} projectPath The project directory path.
 */
exports.syncPackageDeps = (packagePath, projectPath) => {
  const massagedPackagePath = this.massagePackagePath(packagePath)
  const pjson = this.getPackageSettings(massagedPackagePath)
  const manifest = this.getManifest(this.massageManifestPath(projectPath))

  if (!('dependencies' in pjson) || !('dependencies' in manifest)) return

  const deps = Object.assign({}, pjson.dependencies)
  let writeFile = false

  Object.keys(pjson.dependencies).forEach(key => {
    if (
      !(key in manifest.dependencies) ||
            pjson.dependencies[key] === manifest.dependencies[key]
    ) return

    deps[key] = manifest.dependencies[key]

    writeFile = true
  })

  if (!writeFile) return

  pjson.dependencies = deps

  fs.writeFileSync(massagedPackagePath, JSON.stringify(pjson, null, '\t'))
}

/**
 * @param {string} version The version.
 * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
 */
exports.setPackageVersion = (version, packagePath) => {
  this.checkVersion(version)

  const massagedPackagePath = this.massagePackagePath(packagePath)

  const pjson = this.getPackageSettings(massagedPackagePath)

  this.checkPackageVersion(pjson)

  pjson.version = version

  fs.writeFileSync(massagedPackagePath, JSON.stringify(pjson, null, '\t'))
}
