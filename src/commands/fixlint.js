// @ts-check
const { exec, github, cp } = require('../utils')

/**
 * Handles the `/fixlint` command
 * @this {import('gh-helpers').HookOnRepoCommentPayload}
 */
async function fixlint () {
  if (this.type !== 'pull') return
  const installCommand = github.getInput('install-command') || 'npm install'
  const lintCommand = github.getInput('/fixlint.fix-command') || 'npm run fix'

  const prInfo = await github.getPullRequest(this.issue.number)

  if (!prInfo) {
    console.log('PR not found', this.issue.number)
    return false
  } else {
    console.log('PR found', prInfo)
  }
  exec('git config --unset http.https://github.com/.extraheader')
  if (!github.mock) cp.execSync(`git remote add fork ${prInfo.getHeadClonePatURL()}`)
  exec(`git fetch fork ${prInfo.headBranch} --depth=1`)
  exec(`git checkout -b bot-fixed-lint fork/${prInfo.headBranch}`)
  try {
    exec(installCommand)
  } catch (e) {
    await github.comment(this.issue.number, `Sorry, I wasn't able to use the <code>${installCommand}</code> command to install the project because of an error.`)
    return false
  }

  function push () {
    if (!prInfo.canMaintainerModify) throw new Error('Cannot push to PR as the author does not allow maintainers to modify it.')
    exec('git add --all')
    exec('git config user.name "github-actions[bot]"')
    exec('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
    try {
      exec('git commit -m "Fix linting errors"')
    } catch (e) {
      console.log('(No changes to commit!)')
      return false
    }
    exec('git push fork bot-fixed-lint:' + prInfo.headBranch)
    return true
  }

  return new Promise((resolve) => {
    cp.exec(lintCommand, async (error, stdout, stderr) => {
      const log = stdout.toString() + stderr.toString()
      console.log('> ', lintCommand)
      console.log(log)
      if (error) { // Non-zero exit code
        try {
          push()
          await github.comment(this.issue.number, `I ran <code>${lintCommand}</code>, but there are still some linting errors left that must be manually resolved:\n<pre>${log}</pre>`)
          globalThis.__testingLintError = true // test marker
        } catch (e2) {
          console.log(e2)
          await github.comment(this.issue.number, `I ran <code>${lintCommand}</code>, but there are still some linting errors left that must be manually resolved:\n<pre>${log}</pre> As the PR author didn't grant write permissions to the maintainers, the PR author must run <code>${lintCommand}</code> and manually fix the remaining errors.`)
        }
      } else {
        try {
          const ok = push()
          await github.comment(this.issue.number, ok ? `I fixed all linting errors with <code>${lintCommand}</code>.` : 'No linting errors found.')
        } catch (e) {
          console.log(e)
          await github.comment(this.issue.number, `I ran <code>${lintCommand}</code> which fixed the lint errors, but I couldn't push the changes to this branch as the PR author didn't grant write permissions to the maintainers. The PR author must manually run <code>${lintCommand}</code> and push the changes.`)
        }
      }
      resolve(true)
    })
  })
}

module.exports = fixlint
