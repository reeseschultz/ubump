const execa = require('execa')
const error = require('./error')

const getChangelog = async () => {
  let latestTag
  try {
    latestTag = (await execa('git', ['describe', '--abbrev=0'])).stdout
  } catch { }

  if (latestTag) return (await execa('git', ['log', '--oneline', `${latestTag}..HEAD`])).stdout
  return (await execa('git', ['log', '--pretty=oneline'])).stdout
}

const forcePushUpstream = async name =>
  execa('git', ['push', '--follow-tags', '-fu', 'origin', name])

const checkout = async name =>
  execa('git', ['checkout', name])

const subtreeSplit = async (name, dir) =>
  execa('git', ['subtree', 'split', '-P', dir, '-b', name])

const deleteBranch = async name => {
  try {
    await execa('git', ['branch', '-d', name])
  } catch { }
}

const getTrackingBranch = async () => {
  try {
    const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
    return stdout
  } catch { }

  return ''
}

const getCurrentBranch = async () => {
  const { stdout } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
  return stdout
}

const reset = () =>
  execa.sync('git', ['reset', 'HEAD~1'])

const commit = async message =>
  execa('git', ['commit', '-m', message])

const push = async setUpstream => {
  if (setUpstream) return execa('git', ['push', '--follow-tags', '-u', 'origin', await getCurrentBranch()])
  return execa('git', ['push', '--follow-tags'])
}

const hasCommitsAheadOfTracking = async (trackingBranch, currentBranch) => {
  let { stdout } = await execa('git', ['rev-list', '--count', `${trackingBranch}..${currentBranch}`])
  stdout = parseInt(stdout)
  if (isNaN(stdout)) stdout = 0
  return stdout > 0
}

const stageFile = async file =>
  execa('git', ['add', file])

const stageFiles = async () =>
  execa('git', ['add', '-A'])

const getUnstagedFiles = async () => {
  let untrackedFiles = (await execa('git', ['ls-files', '--others', '--exclude-standard'])).stdout
  if (untrackedFiles) untrackedFiles = untrackedFiles.split('\n')
  else untrackedFiles = []

  let trackedFiles = (await execa('git', ['diff', '--name-only'])).stdout
  if (trackedFiles) trackedFiles = trackedFiles.split('\n')
  else trackedFiles = []

  return trackedFiles.concat(untrackedFiles)
}

const hasUnstagedChanges = async () =>
  ((await getUnstagedFiles()).length !== 0)

const unstageChanges = async () =>
  execa('git', ['reset'])

const getStagedFiles = async () => {
  const { stdout } = await execa('git', ['diff', '--name-only', '--cached'])
  if (stdout) return stdout.split('\n')
  return []
}

const hasStagedChanges = async () =>
  ((await getStagedFiles()).length !== 0)

const getChangedAndCommittedFiles = async (cwd, trackingBranch, currentBranch) => {
  const { stdout } = await execa('git', ['diff', '--name-only', trackingBranch, currentBranch])
  if (stdout) return stdout.split('\n').map(str => `${cwd}/${str}`)
  return []
}

const getChangedAndUncommittedFiles = async cwd => {
  const { stdout } = await execa('git', ['status', '--porcelain'])
  if (stdout) return stdout.split('\n').map(str => `${cwd}/${str.slice(3, str.length)}`)
  return []
}

const checkTagAlreadyExists = async name => {
  const { stdout } = await execa('git', ['tag', '-l', name])
  if (stdout) throw new error.TagAlreadyExistsError()
}

const tag = async (name, message) => {
  checkTagAlreadyExists(name)
  await execa('git', ['tag', '-am', message, name])
}

module.exports = {
  getChangelog,
  forcePushUpstream,
  checkout,
  subtreeSplit,
  deleteBranch,
  getTrackingBranch,
  getCurrentBranch,
  reset,
  commit,
  push,
  hasCommitsAheadOfTracking,
  stageFile,
  stageFiles,
  getUnstagedFiles,
  hasUnstagedChanges,
  unstageChanges,
  getStagedFiles,
  hasStagedChanges,
  getChangedAndCommittedFiles,
  getChangedAndUncommittedFiles,
  tag
}
