const inquirer = require('inquirer')
const chalk = require('chalk')
const semver = require('semver')
const ora = require('ora')
const api = require('./api')
const git = require('./git')

const confirm = {
  name: 'confirm',
  type: 'confirm',
  message: 'Are you sure?'
}

const getMargin = stringArray =>
  stringArray.reduce((a, b) => a.length > b.length ? a : b, '').length + 2

const justify = (margin, str) => {
  let whitespace = ''
  for (let i = 0; i < margin - str.length; ++i) { whitespace += ' ' }
  return whitespace
}

const colorVersion = (version, bumpType, originallyNonPrerelease) => {
  const prereleaseComponents = semver.prerelease(version)

  if (prereleaseComponents) {
    version = version.replace(`-${prereleaseComponents.join('.')}`, '')

    if (prereleaseComponents.length === 1) prereleaseComponents.unshift('prerelease')

    switch (bumpType) {
      case api.bumpType.prepatch:
      case api.bumpType.preminor:
      case api.bumpType.premajor:
      case api.bumpType.prerelease:
        prereleaseComponents[prereleaseComponents.length - 1] = chalk.whiteBright.bgGreen.bold(prereleaseComponents[prereleaseComponents.length - 1])
    }
  }

  version = version.split('.')

  switch (bumpType) {
    case api.bumpType.patch:
    case api.bumpType.prepatch:
      version[2] = chalk.whiteBright.bgGreen.bold(version[2])
      break
    case api.bumpType.minor:
    case api.bumpType.preminor:
      version[1] = chalk.whiteBright.bgGreen.bold(version[1])
      break
    case api.bumpType.major:
    case api.bumpType.premajor:
      version[0] = chalk.whiteBright.bgGreen.bold(version[0])
      break
  }

  if (originallyNonPrerelease && bumpType === api.bumpType.prerelease) {
    version[2] = chalk.whiteBright.bgGreen.bold(version[2])
  } // Why? See here: https://github.com/npm/node-semver#functions

  version = version.join('.')
  if (prereleaseComponents) version = `${version}-${prereleaseComponents.join('.')}`
  return version
}

const getColorizedChoices = version => {
  const choices = []

  Object.values(api.bumpType).forEach(bumpType => {
    const choice = { value: bumpType }
    const verzion = colorVersion(api.bumpVersion(version, bumpType), bumpType, semver.prerelease(version) === null)
    choice.name = `${bumpType}${justify(getMargin(Object.values(api.bumpType)), bumpType)}${verzion}`
    choices.push(choice)
  })

  choices.unshift({ name: 'No Change', value: 'none' })

  return choices
}

const unstagedChangesInquiry = async message =>
  inquirer
    .prompt([
      {
        name: 'proceed',
        type: 'list',
        message,
        choices: [
          {
            name: 'Leave those files unstaged. It\'s fine.',
            value: 'unstaged'
          },
          {
            name: 'Stage all of those files.',
            value: 'stage'
          },
          {
            name: 'See a list of the unstaged files to deliberate.',
            value: 'deliberate'
          },
          {
            name: 'Exit ubump to do things.',
            value: 'exit'
          }
        ]
      }
    ])
    .then(async answers => {
      const { proceed } = answers

      let spinner
      switch (proceed) {
        case 'unstaged':
          console.log('\nLeaving those files unstaged.')
          break
        case 'stage':
          console.log('\nStaging all of those files for you.')
          spinner = ora({ text: chalk.bold('Staging.'), spinner: 'line' }).start()
          await git.stageFiles()
          spinner.stop()
          break
        case 'deliberate':
          spinner = ora({ text: chalk.bold('Getting unstaged files.'), spinner: 'line' }).start()
          console.log(`\n${(await git.getUnstagedFiles()).join('\n')}\n`)
          spinner.stop()
          return unstagedChangesInquiry('There should be a list of unstaged files printed above. Now, how would you like to proceed?')
        case 'exit':
          console.log('\nExiting ubump.')
          process.exit()
      }
    })

const stagedChangesInquiry = async message =>
  inquirer
    .prompt([
      {
        name: 'proceed',
        type: 'list',
        message,
        choices: [
          {
            name: 'Keep those currently staged changes, additionally staging ubump-modified files along with them.',
            value: 'keep'
          },
          {
            name: 'Unstage those currently staged changes.',
            value: 'unstage'
          },
          {
            name: 'See a list of the currently staged files to deliberate.',
            value: 'deliberate'
          },
          {
            name: 'Exit ubump to do things.',
            value: 'exit'
          }
        ]
      }
    ])
    .then(async answers => {
      const { proceed } = answers

      let spinner
      switch (proceed) {
        case 'keep':
          console.log('\nKeeping those staged files for you.')
          break
        case 'unstage':
          spinner = ora({ text: chalk.bold('Unstaging.'), spinner: 'line' }).start()
          await git.unstageChanges()
          spinner.stop()
          console.log('\nUnstaged those files for you.')
          break
        case 'deliberate':
          spinner = ora({ text: chalk.bold('Getting staged files.'), spinner: 'line' }).start()
          console.log(`\n${(await git.getStagedFiles()).join('\n')}\n`)
          spinner.stop()
          return stagedChangesInquiry('There should be a list of staged files printed above. Now, how would you like to proceed?')
        case 'exit':
          console.log('\nExiting ubump.')
          process.exit()
      }
    })

const preidInquiry = async defaultPreid =>
  inquirer
    .prompt([
      {
        name: 'preid',
        type: 'input',
        message: 'What should the prerelease identifier be?',
        default: defaultPreid
      }
    ])
    .then(async answers => answers.preid)

const bumpProjectInquiry = async path => {
  const psettings = api.getProjectSettings(path)
  let version = api.getProjectVersion(psettings)
  const choices = getColorizedChoices(version)
  const name = api.getProjectName(psettings)

  return inquirer
    .prompt([
      {
        name: 'bumpType',
        type: 'list',
        message: `What is the type of change for the ${name} project as a whole?`,
        choices
      }
    ])
    .then(async answers => {
      const { bumpType } = answers

      if (bumpType === 'none') return

      if (api.isPre(bumpType)) {
        let defaultPreid = 'prerelease'
        const prereleaseComponents = semver.prerelease(version)
        if (prereleaseComponents !== null) defaultPreid = prereleaseComponents[0]
        version = api.bumpVersion(version, bumpType, await preidInquiry(defaultPreid))
      } else {
        version = api.bumpVersion(version, bumpType)
      }

      const confirm = await inquirer
        .prompt([
          {
            name: 'confirm',
            type: 'confirm',
            message: `Are you sure you're happy with ${version}?`
          }
        ])
        .then(async answers => answers.confirm)

      if (!confirm) return bumpProjectInquiry(path)

      api.setProjectVersion(version, path)

      const spinner = ora({ text: chalk.bold('Staging.'), spinner: 'line' }).start()
      await git.stageFile(path)
      spinner.stop()

      return version
    })
}

const syncPackageDependenciesInquiry = async (packagePath, projectPath) => {
  if (!api.hasPackageDepsToSync(packagePath, projectPath)) return

  const pjson = api.getPackageSettings(packagePath)

  return inquirer
    .prompt([
      {
        name: 'sync',
        type: 'list',
        message: `The '${api.getPackageName(pjson)}' dependencies are out of sync with the containing project. Sync them?`,
        choices: ['Yes', 'No']
      }
    ])
    .then(async answers => {
      const { sync } = answers

      if (sync === 'No') return

      api.syncPackageDeps(packagePath, projectPath)

      const spinner = ora({ text: chalk.bold('Staging.'), spinner: 'line' }).start()
      await git.stageFile(packagePath)
      spinner.stop()
    })
}

const bumpPackageInquiry = async path => {
  const pjson = api.getPackageSettings(path)
  let version = api.getPackageVersion(pjson)
  const choices = getColorizedChoices(api.getPackageVersion(pjson))
  const name = api.getPackageName(pjson)

  return inquirer
    .prompt([
      {
        name: 'bumpType',
        type: 'list',
        message: `What is the type of change for the ${name} package?`,
        choices
      }
    ])
    .then(async answers => {
      const { bumpType } = answers

      if (bumpType === 'none') return

      if (api.isPre(bumpType)) {
        let defaultPreid = 'prerelease'
        const prereleaseComponents = semver.prerelease(version)
        if (prereleaseComponents !== null) defaultPreid = prereleaseComponents[0]
        version = api.bumpVersion(version, bumpType, await preidInquiry(defaultPreid))
      } else {
        version = api.bumpVersion(version, bumpType)
      }

      const confirm = await inquirer
        .prompt([
          {
            name: 'confirm',
            type: 'confirm',
            message: `Are you sure you're happy with ${version}?`
          }
        ])
        .then(async answers => answers.confirm)

      if (!confirm) return bumpPackageInquiry(path)

      api.setPackageVersion(version, path)

      const spinner = ora({ text: chalk.bold('Staging.'), spinner: 'line' }).start()
      await git.stageFile(path)
      spinner.stop()

      return { name, version, unfriendlyName: api.getUnfriendlyPackageName(pjson) }
    })
}

const customCommitMessageInquiry = async commitMessage =>
  inquirer
    .prompt([
      {
        name: 'custom',
        type: 'input',
        message: 'What should the custom commit message say?',
        default: commitMessage
      }
    ])
    .then(async answers => answers.custom)

const commitInquiry = async commitMessage =>
  inquirer
    .prompt([
      {
        name: 'commit',
        type: 'list',
        message: 'Want to commit your changes?',
        choices: [
          {
            name: `Yes, commit with '${commitMessage}' as the commit message.`,
            value: 'Yes'
          },
          {
            name: 'Yes, but customize the commit message.',
            value: 'Custom'
          },
          {
            name: 'No, don\'t commit anything.',
            value: 'No'
          }
        ]
      }
    ])
    .then(async answers => {
      const { commit } = answers

      if (commit === 'No') return false

      if (commit === 'Custom') commitMessage = await customCommitMessageInquiry(commitMessage)

      const spinner = ora({ text: chalk.bold('Committing.'), spinner: 'line' }).start()
      await git.commit(commitMessage)
      spinner.stop()

      return true
    })

const pushInquiry = async (bumpedProjectVersion, setUpstream, skipTagging, tagPrefix, skipTaggingChangelog) =>
  inquirer
    .prompt([
      {
        name: 'push',
        type: 'confirm',
        message: 'Push the changes?'
      }
    ])
    .then(async answers => {
      if (!answers.push) process.exit()

      await inquirer
        .prompt([confirm])
        .then(async answers => {
          if (!answers.confirm) process.exit()
        })

      let tagged = false
      if (bumpedProjectVersion && !skipTagging) {
        const spinner = ora({ text: chalk.bold('Tagging.'), spinner: 'line' }).start()

        let changelog = `Release ${tagPrefix}${bumpedProjectVersion}\n`
        if (!skipTaggingChangelog) changelog += await git.getChangelog(await git.getLatestTag)

        await git.tag(`${tagPrefix}${bumpedProjectVersion}`, changelog)
        tagged = true

        spinner.stop()
      }

      const spinner = ora({ text: chalk.bold('Pushing.'), spinner: 'line' }).start()
      await git.push(setUpstream)
      spinner.stop()

      return tagged
    })

const subtreeSplitInquiry = async (bumpedPackages, skipTagging, tagPrefix, skipTaggingChangelog) =>
  inquirer
    .prompt([
      {
        name: 'subtree',
        type: 'confirm',
        message: `Push a subtree branch for ${bumpedPackages.length > 1 ? 'each' : 'the'} package, tagging accordingly?`
      }
    ])
    .then(async answers => {
      if (!answers.subtree) process.exit()

      await inquirer
        .prompt([confirm])
        .then(async answers => {
          if (!answers.confirm) process.exit()
        })

      const originalBranch = await git.getCurrentBranch()

      for (const bumpedPackage of bumpedPackages) {
        const spinner = ora({ text: chalk.bold(`Splitting ${bumpedPackage.name} with ${bumpedPackage.unfriendlyName} as the branch name.`), spinner: 'line' }).start()

        await git.deleteBranch(bumpedPackage.unfriendlyName)

        await git.subtreeSplit(bumpedPackage.unfriendlyName, bumpedPackage.dir.replace(`${api.cwd()}/`, ''))

        await git.checkout(bumpedPackage.unfriendlyName)
        const latestTagCommitMessage = await git.getCommitMessageFromId(await git.getLatestTag())
        await git.checkout(originalBranch)
        const latestTagCommit = await git.getCommitFromMessage(latestTagCommitMessage)
        let changelog = `${bumpedPackage.name} Release ${bumpedPackage.unfriendlyName}/${tagPrefix}${bumpedPackage.version}\n`
        if (!skipTaggingChangelog) changelog += await git.getChangelog(latestTagCommit)
        await git.checkout(bumpedPackage.unfriendlyName)

        if (!skipTagging) await git.tag(`${bumpedPackage.unfriendlyName}/${tagPrefix}${bumpedPackage.version}`, changelog)

        await git.forcePushUpstream(bumpedPackage.unfriendlyName)

        await git.checkout(originalBranch)

        spinner.stop()
      }
    })

const masterInquiry = async () =>
  inquirer
    .prompt(
      {
        name: 'confirm',
        type: 'confirm',
        message: `Your current branch, ${await git.getCurrentBranch()}, is not tracking origin/master. Are you sure you want to proceed?`
      }
    )
    .then(async answers => {
      if (!answers.confirm) process.exit()
    })

module.exports = {
  unstagedChangesInquiry,
  stagedChangesInquiry,
  bumpProjectInquiry,
  syncPackageDependenciesInquiry,
  bumpPackageInquiry,
  commitInquiry,
  pushInquiry,
  subtreeSplitInquiry,
  masterInquiry
}
