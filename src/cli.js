const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const ora = require('ora')
const api = require('./api')
const git = require('./git')
const inquiry = require('./inquiry')

let shouldRollBackCommitOnExit = false
const rollback = () => {
  if (shouldRollBackCommitOnExit) {
    console.log('\nRolling back ubump commit⁠—but changes will be preserved.')
    git.reset()
  }

  console.log()
}

process.on('exit', code => {
  if (code === 1) rollback()
  else console.log(`\nGo to ${chalk.underline.bold('https://patreon.com/reeseschultz')} 👈 to support the ubump maintainer.\n`)
})

const validBumpTypesArray = Object.values(api.bumpType).map(bumpType => bumpType.toLowerCase())

const massageProjectPath = projectPath => {
  projectPath = projectPath || './'
  projectPath += projectPath.endsWith('/') ? '' : '/'
  return projectPath
}

const conductPackageInquiries = async (packagePath, packageDir, bumpedPackages, skipCommit) => {
  console.log()

  await inquiry.syncPackageDependenciesInquiry(packagePath, api.cwd())

  const bumpedPackage = await inquiry.bumpPackageInquiry(packagePath, skipCommit)

  if (bumpedPackage) {
    bumpedPackage.dir = packageDir
    bumpedPackages.push(bumpedPackage)
  }

  return bumpedPackages
}

const getChangedFiles = async (userHasCommitted, trackingBranch, currentBranch) => {
  if (userHasCommitted) return git.getChangedAndCommittedFiles(api.cwd(), trackingBranch, currentBranch)
  else return git.getChangedAndUncommittedFiles(api.cwd())
}

module.exports = () => require('yargs')
  .command('package-name <package-path>', 'Gets a package name at the provided path.\n', yargs => {
    yargs
      .positional('package-path', {
        type: 'string',
        describe: 'Relative or absolute path to the package.'
      })
  }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      console.log(api.getPackageName(api.getPackageSettings(argv['package-path'])))
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('package-version <package-path>', 'Gets a package version at the provided path.\n', yargs => {
    yargs
      .positional('package-path', {
        type: 'string',
        describe: 'Relative or absolute path to the package.'
      })
  }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      console.log(api.getPackageVersion(api.getPackageSettings(argv['package-path'])))
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('project-name', 'Gets a project name.\n', yargs => { }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      console.log(api.getProjectName(api.getProjectSettings(massageProjectPath(argv['project-path']))))
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('project-version', 'Gets a project version.\n', yargs => { }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      console.log(api.getProjectVersion(api.getProjectSettings(massageProjectPath(argv['project-path']))))
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('bump-version <some-version> <bump-type> [preid]', 'Bumps a version with the provided bump type—with an optional prerelease identifier.\n', yargs => {
    yargs
      .positional('some-version', {
        type: 'string',
        describe: 'Version to bump.'
      })
      .positional('bump-type', {
        type: 'string',
        describe: 'Bump type.',
        choices: validBumpTypesArray
      })
      .positional('preid', {
        type: 'string',
        describe: 'Prerelease identifier—defaults to \'prerelease\' if there is no existing identifier and none is provided—defaults to the existing prerelease identifier otherwise—only applied when a \'pre\' bump is used.'
      })
  }, argv => {
    try {
      console.log(api.bumpVersion(argv['some-version'], argv['bump-type'], argv.preid))
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('bump-package <package-path> <bump-type> [preid]', 'Bumps a package\'s version with the provided bump type and package path—with an optional prerelease identifier.\n', yargs => {
    yargs
      .positional('package-path', {
        type: 'string',
        describe: 'Relative or absolute path to the package.'
      })
      .positional('bump-type', {
        type: 'string',
        describe: 'Bump type.',
        choices: validBumpTypesArray
      })
      .positional('preid', {
        type: 'string',
        describe: 'Prerelease identifier—defaults to \'prerelease\' if there is no existing identifier and none is provided—defaults to the existing prerelease identifier otherwise—only applied when a \'pre\' bump is used.'
      })
      .positional('preid', {
        type: 'string',
        describe: 'True if other packages referencing this one should update to use this package\'s new version.',
        default: true
      })
  }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))

      const path = argv['package-path']

      const bumpedVersion = api.bumpVersion(
        api.getPackageVersion(api.getPackageSettings(path)),
        argv['bump-type'],
        argv.preid
      )

      api.setPackageVersion(bumpedVersion, path)

      console.log(bumpedVersion)
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('bump-project <bump-type> [preid]', 'Bumps a project\'s version with the provided bump type—with an optional prerelease identifier.\n', yargs => {
    yargs
      .positional('bump-type', {
        type: 'string',
        describe: 'Bump type.',
        choices: validBumpTypesArray
      })
      .positional('preid', {
        type: 'string',
        describe: 'Prerelease identifier—defaults to \'prerelease\' if there is no existing identifier and none is provided—defaults to the existing prerelease identifier otherwise—only applied when a \'pre\' bump is used.'
      })
  }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))

      const path = massageProjectPath(argv['project-path'])

      const bumpedVersion = api.bumpVersion(
        api.getProjectVersion(api.getProjectSettings(path)),
        argv['bump-type'],
        argv.preid
      )

      api.setProjectVersion(bumpedVersion, path)

      console.log(bumpedVersion)
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('sync-package-deps <package-path>', 'Synchronizes package dependencies with those of the project, including the editor version.\n', yargs => {
    yargs
      .positional('package-path', {
        type: 'string',
        describe: 'Relative or absolute path to the package.'
      })
  }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      api.syncPackageDeps(argv['package-path'])
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('sync-internal-refs', 'Synchronizes all packages internally referencing each other in the project so that the latest version is specified in their respective dependencies.', yargs => { }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      api.syncInternalRefs()
    } catch (err) {
      console.error(err.message)
      process.exit(1)
    }
  })
  .command('$0', 'Start interactive mode.\n', yargs => {
    yargs
      .option('project-tag-prefix', {
        type: 'string',
        describe: 'The prefix of the project tag (also used in commit messages by default). Only for interactive mode.',
        default: 'v'
      })
      .option('package-tag-prefix', {
        type: 'string',
        describe: 'The prefix for package tags (also used in commit messages by default). Only for interactive mode.',
        default: 'v'
      })
      .option('skip-commit', {
        type: 'boolean',
        describe: 'Skips file I/O, staging, and committing associated with version changes (useful if you\'re only interested in tagging). Only for interactive mode.',
        default: false
      })
      .option('skip-project', {
        type: 'boolean',
        describe: 'Skips asking about the project if true. Only for interactive mode.',
        default: false
      })
      .option('skip-packages', {
        type: 'boolean',
        describe: 'Skips asking about packages if true. Only for interactive mode.',
        default: false
      })
      .option('skip-project-tagging', {
        type: 'boolean',
        describe: 'Skips project tagging if true. Only for interactive mode.',
        default: false
      })
      .option('skip-package-tagging', {
        type: 'boolean',
        describe: 'Skips package tagging if true. Only for interactive mode.',
        default: false
      })
      .option('skip-project-tagging-changelog', {
        type: 'boolean',
        describe: 'Skips changelog generation in project tags if true. Only for interactive mode.',
        default: false
      })
      .option('skip-package-tagging-changelog', {
        type: 'boolean',
        describe: 'Skips changelog generation in package tags if true. Only for interactive mode.',
        default: false
      })
      .option('skip-locally-unchanged-packages', {
        type: 'boolean',
        describe: 'Skips all packages but those that have changed locally. Only for interactive mode.',
        default: false
      })
      .option('skip-internal-ref-syncing', {
        type: 'boolean',
        describe: 'Skips synchronizing internal references. Only for interactive mode.',
        default: false
      })
  }, argv => {
    try {
      process.chdir(massageProjectPath(argv['project-path']))
      api.getProjectSettings(api.cwd())
    } catch (err) {
      console.error('\nThis does not appear to be a Unity project directory. It may also be possible that you\'re not in the right branch, such as a subtree branch.')
      process.exit(1)
    }

    api.globPackages(async packagePaths => {
      console.log(fs.readFileSync(path.resolve(__dirname, '../logo.txt'), 'utf8'))

      const trackingBranch = await git.getTrackingBranch()
      if (trackingBranch !== 'origin/master') await inquiry.masterInquiry()

      let setUpstream = false
      if (trackingBranch === '') setUpstream = true

      if (await git.hasUnstagedChanges()) await inquiry.unstagedChangesInquiry('\nubump noticed you have unstaged changes. That\'s not a problem for ubump, but it\'s possible you might have forgotten to stage or commit something. How would you like to proceed?')
      if (await git.hasStagedChanges()) await inquiry.stagedChangesInquiry('\nubump stages all packagePaths it touches—and you already have staged changes. How would you like to proceed?')

      console.log()

      let skipCommit = argv['skip-commit']
      let skipProject = argv['skip-project']
      let bumpedProjectVersion
      if (!skipProject) bumpedProjectVersion = await inquiry.bumpProjectInquiry(api.cwd(), skipCommit)

      const skipPackages = argv['skip-packages']

      let bumpedPackages = []
      if (!skipPackages && packagePaths.length > 0) {
        const currentBranch = await git.getCurrentBranch()
        const userHasCommitted = await git.hasCommitsAheadOfTracking(trackingBranch, currentBranch)

        for (const packagePath of packagePaths) {
          const packageDir = api.getDir(packagePath)

          if (argv['skip-locally-unchanged-packages']) {
            for (const changedFile of await getChangedFiles(userHasCommitted, trackingBranch, currentBranch)) {
              const changedFileDir = api.getDir(changedFile)

              if (changedFileDir.includes(packageDir)) {
                bumpedPackages = await conductPackageInquiries(packagePath, packageDir, bumpedPackages, skipCommit)
                break
              }
            }
          } else {
            bumpedPackages = await conductPackageInquiries(packagePath, packageDir, bumpedPackages, skipCommit)
          }
        }
      }

      if (!skipCommit && !bumpedProjectVersion && bumpedPackages.length === 0) {
        console.log('\nNo reported version changes.')
        process.exit()
      }

      if (!skipCommit && !skipPackages && packagePaths.length > 0 && !argv['skip-internal-ref-syncing']) {
        const spinner = ora({ text: chalk.bold('Syncing internal references between your packages.'), spinner: 'line' }).start()
        api.syncInternalRefs()
        spinner.stop()
      }

      const projectTagPrefix = argv['project-tag-prefix']
      const packageTagPrefix = argv['package-tag-prefix']

      if (!skipCommit) {
        let commitMessage = bumpedProjectVersion ? `Bump project to ${projectTagPrefix}${bumpedProjectVersion};` : 'Bump'
        bumpedPackages.forEach(bumpedPackage => {
          commitMessage = `${commitMessage} ${bumpedPackage.name} to ${packageTagPrefix}${bumpedPackage.version};`
        })

        if (commitMessage.endsWith(';')) commitMessage = commitMessage.slice(0, commitMessage.length - 1)

        console.log()
        shouldRollBackCommitOnExit = await inquiry.commitInquiry(commitMessage)

        if (!shouldRollBackCommitOnExit) return

        const pushed = await inquiry.pushInquiry(setUpstream)

        shouldRollBackCommitOnExit = false

        if (pushed) console.log(`\nSuccessfully pushed commit.`)
      }

      if (bumpedProjectVersion !== undefined && !skipProject && !argv['skip-project-tagging']) {
        console.log()
        const tagged = await inquiry.projectTagInquiry(bumpedProjectVersion, setUpstream, projectTagPrefix, argv['skip-project-tagging-changelog'])
        if (tagged) console.log(`\nSuccessfully pushed commit tagged with ${projectTagPrefix}${bumpedProjectVersion}.`)
      }

      if (bumpedPackages.length === 0 || fs.existsSync(`${api.cwd()}/package.json`) || skipPackages) return

      console.log()
      await inquiry.subtreeSplitInquiry(bumpedPackages, argv['skip-package-tagging'], packageTagPrefix, argv['skip-package-tagging-changelog'])

      console.log('\nSuccessfully completed subtree splitting.')
    })
  })
  .option('project-path', {
    type: 'string',
    describe: 'Relative or absolute path to a Unity project. Defaults to the current working directory.'
  })
  .argv
