class InvalidVersionError extends Error {
  constructor () {
    super()
    this.message = 'Version is invalid.'
    this.name = 'InvalidVersionError'
  }
}

class InvalidBumpTypeError extends Error {
  constructor () {
    super()
    this.message = 'Bump type is invalid.'
    this.name = 'InvalidBumpTypeError'
  }
}

class EditorVersionParseError extends Error {
  constructor () {
    super()
    this.message = 'Could not parse the project\'s \'m_EditorVersion\' property.'
    this.name = 'EditorVersionParseError'
  }
}

class PackageNameParseError extends Error {
  constructor () {
    super()
    this.message = 'Could not parse the package\'s \'name\' property.'
    this.name = 'PackageNameParseError'
  }
}

class PackageDisplayNameParseError extends Error {
  constructor () {
    super()
    this.message = 'Could not parse the package\'s \'displayName\' property.'
    this.name = 'PackageDisplayNameParseError'
  }
}

class PackageVersionParseError extends Error {
  constructor () {
    super()
    this.message = 'Could not parse the package\'s \'version\' property.'
    this.name = 'PackageVersionParseError'
  }
}

class ProjectVersionParseError extends Error {
  constructor () {
    super()
    this.message = 'Could not parse the project\'s \'bundleVersion\' property.'
    this.name = 'ProjectVersionParseError'
  }
}

class ProjectProductNameParseError extends Error {
  constructor () {
    super()
    this.message = 'Could not parse the project\'s \'productName\' property.'
    this.name = 'ProjectProductNameParseError'
  }
}

class MissingManifestError extends Error {
  constructor () {
    super()
    this.message = 'Project is missing \'manifest.json\'.'
    this.name = 'MissingManifestError'
  }
}

class MissingProjectSettingsError extends Error {
  constructor () {
    super()
    this.message = 'Project is missing \'ProjectSettings/ProjectSettings.asset\'.'
    this.name = 'MissingProjectSettingsError'
  }
}

class MissingProjectVersionError extends Error {
  constructor () {
    super()
    this.message = 'Project is missing \'ProjectSettings/ProjectVersion.txt\'.'
    this.name = 'MissingProjectVersionError'
  }
}

class MissingPackageSettingsError extends Error {
  constructor () {
    super()
    this.message = 'Could not find package\'s \'package.json\'.'
    this.name = 'MissingPackageSettingsError'
  }
}

class TagAlreadyExistsError extends Error {
  constructor () {
    super()
    this.message = 'Tag already exists. Cannot create another tag with the same name.'
    this.name = 'TagAlreadyExistsError'
  }
}

module.exports = {
  InvalidVersionError,
  InvalidBumpTypeError,
  EditorVersionParseError,
  PackageNameParseError,
  PackageDisplayNameParseError,
  PackageVersionParseError,
  ProjectVersionParseError,
  ProjectProductNameParseError,
  MissingManifestError,
  MissingProjectSettingsError,
  MissingProjectVersionError,
  MissingPackageSettingsError,
  TagAlreadyExistsError
}
