// @ts-check
const { WRITE_ROLES, github } = require('../utils')

/**
 * Handles the `/mergeonpass [retries] [mode: squash (default), merge, rebase]\n[custom commit message]` command
 * @this {import('gh-helpers').HookOnRepoCommentPayload}
 */
async function mergeonpass (args, sargs) {
  if (!WRITE_ROLES.includes(this.role)) {
    // Check again here for write role
    return
  }
  // wait for upto 10 minutes for the checks to pass by default
  const MAX_WAIT = parseInt(github.getInput('/mergeonpass.maxWaitTime')) || 20 * 60 * 1000
  const DEFAULT_RETRIES = parseInt(github.getInput('/mergeonpass.defaultRetries')) || 1
  let defaultMode = github.getInput('/mergeonpass.defaultMode') || 'squash'
  if (!['squash', 'merge', 'rebase'].includes(defaultMode)) defaultMode = 'squash'
  if (this.type !== 'pull') return
  let retries = DEFAULT_RETRIES
  let mode = defaultMode
  const [first, message] = sargs.split('\n')
  if (first) {
    const [_retries, _mode] = first.split(' ')
    retries = parseInt(_retries) || retries
    mode = _mode || mode
    if (!['squash', 'merge', 'rebase'].includes(mode)) {
      return raise('Invalid merge mode, must be one of { squash, merge, rebase } set')
    }
  }
  const prInfo = await github.getPullRequest(this.issue.number)
  const checks = await github.getPullRequestChecks(prInfo.number)
  console.log('PR Checks', checks)
  if (!checks.length) {
    // No checks found, sometimes the checks are not yet started. So wait a bit before below code runs.
    await new Promise(resolve => setTimeout(resolve, 5000))
  }

  do {
    const waited = await github.waitForPullRequestChecks(prInfo.number, MAX_WAIT)
    console.log('Waited for checks', waited)
    if (waited.every(e => e.conclusion === 'success')) {
      return await github.mergePullRequest(prInfo.number, { method: mode, title: message })
    } else if (waited.some(e => e.conclusion === 'failure')) {
      await github.retryPullRequestChecks(prInfo.number)
      console.log('Retrying checks', retries)
    } else {
      return raise(`Sorry, I couldn't merge the PR because some checks are in an unknown state.\n<pre>${JSON.stringify(waited, null, 2)}</pre>`)
    }
  } while (retries-- > 0)

  return raise("Sorry, I couldn't merge the PR because some checks are still failing.")

  async function raise (message) {
    await github.comment(this.issue.number, message)
  }
}

mergeonpass.requiresExplicitEnable = true

module.exports = mergeonpass
