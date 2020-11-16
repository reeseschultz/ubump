![Video of using ubump's interactive CLI mode.](/ubump.gif)

# ubump

[![Discord Shield](https://discordapp.com/api/guilds/732665868521177117/widget.png?style=shield)](https://discord.gg/CZ85mguYjK)
[![NPM Version](https://img.shields.io/npm/v/ubump)](https://npmjs.com/ubump)
[![Code Style](https://img.shields.io/badge/code%20style-standard-brightgreen)](https://standardjs.com/)

SemVer bumping for Unity projects and UPM packages.

## Why?

You have a Unity project, package, or monorepo of packages that you want to bump using automated release processes. `ubump` can do that for you, both as a platform-agnostic CLI and Node-based API. The interative CLI mode will even do all the committing, pushing, tagging, and changelog generation for you. `ubump` additionally remembers to sync package dependencies with those of the containing project. But you're in control: configure and use `ubump` however you like; orchestrate it in CI if you want.

## Install & Run

1. Get a reasonably modern version of [Git](https://git-scm.com/downloads).
2. Get [Node.js](https://nodejs.org) >= v10.0.0, which should include `npx`, [the Node package runner](https://www.npmjs.com/package/npx).
3. Run `ubump` with `npx ubump`.

*Optionally* you can run `npm i -g ubump` to permanently install `ubump` on a global basis. Otherwise `npx` will download a new copy of `ubump` each time it's run. Having `ubump` pre-installed makes startup faster, but the tradeoff is remembering to update it occasionally with `npm i -g ubump`.

### Create an Alias

Maybe `npx ubump` is too verbose. If you're using a Unix-like operating system or subsystem, run this one-liner to create a permanent alias called `ubump`:

```sh
p=$HOME/.bashrc && touch $p && echo -e '\nalias ubump="npx ubump"' >> $p && source $p
```

## Windows Note

On Windows (specifically 10), `ubump` is only confirmed to fully work with PowerShell. This appears to be a [Node.js](https://nodejs.org) and/or [Inquirer.js](https://www.npmjs.com/package/inquirer) problem. Please reach out by submitting an issue if you can help improve the Windows experience.

## Usage

For the `ubump` CLI to find a Unity project, either run it from the project's root directory, *or* specify the path, relative or absolute, with the `--project-path` option.

### Interactive CLI

Running `ubump` without any commands will result in output similar to the following:

```
        __                                    
       /\ \                                   
 __  __\ \ \____  __  __    ___ ___   _____   
/\ \/\ \\ \ '__`\/\ \/\ \ /' __` __`\/\ '__`\ 
\ \ \_\ \\ \ \L\ \ \ \_\ \/\ \/\ \/\ \ \ \L\ \
 \ \____/ \ \_,__/\ \____/\ \_\ \_\ \_\ \ ,__/
  \/___/   \/___/  \/___/  \/_/\/_/\/_/\ \ \/ 
                                        \ \_\ 
                                         \/_/ 


? What is the type of change for the ReeseUnityDemos project as a whole? (Use arrow keys)
❯ No Change 
  Patch       0.5.10 
  Minor       0.6.0 
  Major       1.0.0 
  Prepatch    0.5.10-prerelease.0 
  Preminor    0.6.0-prerelease.0 
  Premajor    1.0.0-prerelease.0 
(Move up and down to reveal more choices)
```

And that's just the tip of the iceberg. `ubump` sanity-checks your project for unstaged and staged changes. It also lets you know when you're not in the `master` branch. Not to mention, when you select a `pre` bump type, you will be further prompted for a specific prerelease identifier—the default is the existing one if it exists—otherwise it's just `prerelease`.

**Vim users:** You can also use the `j` and `k` keys to move up and down.

#### Options

These are options specific to the interactive CLI:

**Option**|**Description**|**Default**
:-----:|:-----:|:-----:
`--project-tag-prefix`|The prefix of the project tag (also used in commit messages by default).|`v`
`--package-tag-prefix`|The prefix for package tags (also used in commit messages by default).|`v`
`--skip-commit`|Skips file I/O, staging, and committing associated with version changes (useful if you're only interested in tagging).|`false`
`--skip-project`|Skips asking about the project if `true`.|`false`
`--skip-packages`|Skips asking about packages if `true`.|`false`
`--skip-project-tagging`|Skips project tagging if `true`.|`false`
`--skip-package-tagging`|Skips package tagging if `true`.|`false`
`--skip-project-tagging-changelog`|Skips changelog generation in project tags if `true`.|`false`
`--skip-package-tagging-changelog`|Skips changelog generation in package tags if `true`.|`false`
`--skip-locally-unchanged-packages`|Skips all packages but those that have changed locally.|`false`
`--skip-internal-ref-syncing`|Skips synchronizing internal references.|`false`

### Non-Interactive CLI

The best way to learn the non-interactive CLI is to pass the `--help` option to `ubump`, but you also might want to look at the commands below:

#### Commands

**Command**|**Positional Parameters**|**Description**
:-----:|:-----:|:-----:
`package-name`| `<package-path>`|Gets a package name at the provided path.
`package-version`| `<package-path>`|Gets a package version at the provided path.
`project-name`| |Gets a project name.
`project-version`| |Gets a project version.
`bump-version`|`<some-version>` `<bump-type>` `[preid]`|Bumps a version with the provided bump type—with an optional prerelease identifier.
`bump-package`|`<package-path>` `<bump-type>` `[preid]`|Bumps a package's version with the provided bump type and package path—with an optional prerelease identifier.
`bump-project`|`<bump-type>` `[preid]`|Bumps a project's version with the provided bump type—with an optional prerelease identifier.
`sync-package-deps`|`<package-path>`|Synchronizes package dependencies with those of the project, including the editor version.
`sync-internal-refs`||Synchronizes all packages internally referencing each other in the project so that the latest version is specified in their respective dependencies.

### API

Using `ubump` as an API? Install it as a dependency in your Node project like so:

```sh
npm i ubump
```

Then you can import it in a file via:

```sh
const ubump = require('ubump')
```

#### Bump Types

The API has a helper object literal called `bumpType` with the following properties:

* `patch`
* `minor`
* `major`
* `prepatch`
* `preminor`
* `premajor`
* `prerelease`

These are meant to be passed to some functions listed below:

#### Functions

**Function**|**Positional Parameters**|**Description**
:-----:|:-----:|:-----:
`isPre`| `<bumpType>`|`true` if passed bump type is 'prepatch,' 'preminor,' 'premajor,' or 'prerelease.' Case is irrelevant.
`versionIsValid`| `<version>`|`true` if passed version is loosely considered to be valid in terms of SemVer. Permits prerelease identifiers.
`bumpVersion`| `<version> <bumpType> [preid]`|Bumps a version with the bump type and optional prerelease identifier.
`getPackageName`| `<pjson>`|Gets a package's (display) name.
`getUnfriendlyPackageName`| `<pjson>`|Gets a package's (unfriendly) name, e.g. a package with a `name` property set as `com.reese.spawning` would have an unfriendly name of `spawning`.
`getPackageVersion`| `<pjson>`|Gets a package's version.
`getProjectVersion`| `<psettings>`|Gets a project's version.
`getManifest`| `<projectPath>`|Gets a project's manifest (Packages/manifest.json) file as a string.
`getProjectSettings`| `<projectPath>`|Gets the project settings (ProjectSettings/ProjectSettings.asset) file as a string.
`getProjectName`| `<psettings>`|Gets a project's (product) name.
`setProjectVersion`| `<version> <projectPath>`|Sets a project version.
`getPackageSettings`| `<packagePath>`|Gets the package settings (package.json) file as a string.
`hasPackageDepsToSync`| `<packagePath> <projectPath>`|`true` if the passed package has dependencies to synchronize with the containing project, or if the editor version should be synchronized.
`setPackageVersion`| `<version> <packagePath>`|Sets a package's version.
`syncPackageDeps`| `<packagePath> <projectPath>`|Synchronizes package dependencies with those of the project, including the editor version.
`syncInternalRefs`||Synchronizes all packages internally referencing each other in the project so that the latest version is specified in their respective dependencies.

## Contributor Agreement

By submitting a pull request, you agree to license your work under [this project's MIT license](https://github.com/reeseschultz/ubump/blob/master/LICENSE).
