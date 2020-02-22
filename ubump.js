#!/usr/bin/env node

if (require.main === module) require('./src/cli')()

const api = require('./src/api')

module.exports = { // (De facto public API.)
  /**
   * An object containing valid bump type options that may be passed to
   * other ubump functions.
   */
  bumpType: api.bumpType,

  /**
   * `true` if passed bump type is 'prepatch,' 'preminor,' 'premajor,'
   * or 'prerelease.' Case is irrelevant.
   *
   * @param {string} bumpType The bump type.
   */
  isPre: api.isPre,

  /**
   * `true` if passed version is loosely considered to be valid in terms of
   * SemVer. Permits prerelease identifiers.
   *
   * @param {string} version The version.
   */
  versionIsValid: api.versionIsValid,

  /**
   * Bumps a version with the bump type and optional prerelease
   * identifier.
   *
   * @param {string} version The version.
   * @param {string} bumpType The bump type.
   * @param {string} [preid] The prerelease identifier.
   *
   * @throws {InvalidVersionError}
   * @throws {InvalidBumpTypeError}
   */
  bumpVersion: api.bumpVersion,

  /**
   * Gets a package's (display) name.
   *
   * @param {string} pjson The package settings (package.json) file as a string.
   *
   * @throws {PackageDisplayNameParseError}
   */
  getPackageName: api.getPackageName,

  /**
   * Gets a package's (unfriendly) name, e.g. a package with a `name` property
   * set as `com.reese.spawning` would have an unfriendly name of `spawning`.
   *
   * @param {string} pjson The package settings (package.json) file as a string.
   *
   * @throws {PackageNameParseError}
   */
  getUnfriendlyPackageName: api.getUnfriendlyPackageName,

  /**
   * Gets a package's version.
   *
   * @param {string} pjson The package settings (package.json) file as a string.
   *
   * @throws {PackageVersionParseError}
   */
  getPackageVersion: api.getPackageVersion,

  /**
   * Gets a project's version.
   *
   * @param {string} psettings The project settings file as a string.
   *
   * @throws {ProjectVersionParseError}
   * @throws {InvalidVersionError}
   */
  getProjectVersion: api.getProjectVersion,

  /**
   * Gets a project's manifest (Packages/manifest.json) file as a string.
   *
   * @param {string} projectPath The project directory path.
   *
   * @throws {MissingManifestError}
   */
  getManifest: api.getManifest,

  /**
   * Gets the project settings (ProjectSettings/ProjectSettings.asset) file as a string.
   *
   * @param {string} projectPath The project directory path.
   *
   * @throws {MissingProjectSettingsError}
   */
  getProjectSettings: api.getProjectSettings,

  /**
   * Gets a project's (product) name.
   *
   * @param {string} psettings The project settings file as a string.
   *
   * @throws {ProjectProductNameParseError}
   */
  getProjectName: api.getProjectName,

  /**
   * Sets a project version.
   *
   * @param {string} version The version.
   * @param {string} projectPath The project directory path.
   *
   * @throws {InvalidVersionError}
   * @throws {MissingProjectSettingsError}
   * @throws {ProjectVersionParseError}
   */
  setProjectVersion: api.setProjectVersion,

  /**
   * Gets the package settings (package.json) file as a string.
   *
   * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
   *
   * @throws {MissingPackageSettingsError}
   */
  getPackageSettings: api.getPackageSettings,

  /**
   * `true` if the passed package has dependencies to synchronize
   * with the containing project (from Packages/manifest.json), or if the
   * editor version should be synchronized
   * (from ProjectSettings/ProjectVersion.txt).
   *
   * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
   * @param {string} projectPath The project directory path.
   *
   * @throws {MissingPackageSettingsError}
   * @throws {MissingManifestError}
   */
  hasPackageDepsToSync: api.hasPackageDepsToSync,

  /**
   * Synchronizes package dependencies with those of the containing project
   * (from Packages/manifest.json), and also the editor version
   * (from ProjectSettings/ProjectVersion.txt).
   *
   * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
   * @param {string} projectPath The project directory path.
   *
   * @throws {MissingPackageSettingsError}
   * @throws {MissingManifestError}
   */
  syncPackageDeps: api.syncPackageDeps,

  /**
   * Sets a package's version.
   *
   * @param {string} version The version.
   * @param {string} packagePath The path to the package (either its directory, or the associated package.json file).
   *
   * @throws {InvalidVersionError}
   * @throws {MissingPackageSettingsError}
   * @throws {PackageVersionParseError}
   */
  setPackageVersion: api.setPackageVersion
}
