const cp = require('child_process')
const fs = require('fs')
const github = require('gh-helpers')()

const exec = (cmd) => github.mock ? console.log('> ', cmd) : (console.log('> ', cmd), cp.execSync(cmd, { stdio: 'inherit' }))
function findFile (tryPaths) {
  const path = tryPaths.find(path => fs.existsSync(path))
  return [path, fs.readFileSync(path, 'utf-8')]
}

const commands = {
  async makerelease (newVersion) {
    const releaseSeparator = github.getInput('/makerelease.releaseCommitsStartWith') || 'Release '
    const maxListedCommits = github.getInput('/makerelease.maxListedCommits') || 32

    const defaultBranch = await github.getDefaultBranch()
    exec(`git fetch origin ${defaultBranch} --depth 16`)
    exec(`git checkout ${defaultBranch}`)

    let historyPath, currentHistory, historyInsertionIndex
    try {
      [historyPath, currentHistory] = findFile(['HISTORY.md', 'history.md', './docs/history.md', './docs/HISTORY.md', './doc/history.md', './doc/HISTORY.md'])
    } catch (e) {
      [historyPath, currentHistory] = findFile(['readme.md', 'README.md'])
      const readmeLines = currentHistory.split('\n')
      for (let i = 0; i < readmeLines.length; i++) {
        const line = readmeLines[i]
        if (line.startsWith('#') && line.toLowerCase().endsWith('# history')) {
          historyInsertionIndex = i + 1
          break
        }
      }
    }

    let currentVersion
    const manifestVersionSubstring = {}
    // Python
    for (const file of ['setup.py', 'pyproject.toml']) {
      if (!fs.existsSync(file)) continue
      const currentManifestRaw = fs.readFileSync(file, 'utf8')
      ;[manifestVersionSubstring[file], currentVersion] = currentManifestRaw.match(/version\s?=\s?['"](.*)['"]/) ?? []
    }
    // Node.js
    if (fs.existsSync('./package.json')) {
      const currentManifestRaw = fs.readFileSync('./package.json', 'utf8')
      currentVersion = JSON.parse(currentManifestRaw).version
      manifestVersionSubstring['./package.json'] = `"version": "${currentVersion}"`
    }
    if (!currentVersion) {
      // Get the latest version from HISTORY.md
      const historyLines = currentHistory.split('\n')
      for (const line of historyLines) {
        if (line.startsWith('#')) {
          const header = line.split('# ')[1]?.trim()
          if (!header) continue
          if (header[0] === 'v' && header[1].isNumeric()) {
            currentVersion = header.slice(1)
            break
          } else if (!isNaN(header[0])) {
            currentVersion = header
            break
          }
        }
      }
      if (!currentVersion) {
        await github.comment(this.triggerIssueId, "Sorry, I couldn't find the current version.")
        return
      }
      console.log('Current version is', currentVersion)
    }

    if (!newVersion) {
      const x = currentVersion.split('.')
      x[1]++
      x[2] = 0
      newVersion = x.join('.')
    }

    const newHistoryLines = currentHistory.split('\n')
    const latestCommits = await github.getRecentCommitsInRepo(maxListedCommits)
    console.log('Latest commits', latestCommits)
    if (!latestCommits.length) {
      await github.comment(this.triggerIssueId, "Sorry, I couldn't find any commits since the last release.")
      return
    }
    const md = [`${newHistoryLines.some(l => l.startsWith('### ')) ? '###' : '##'} ${newVersion}`]

    for (const { url, login, message } of latestCommits) {
      const [title] = message.split('\n')
      if (title.startsWith(releaseSeparator)) break
      else md.push(`* [${title}](${url}) (thanks @${login})`)
    }

    // Branch based on where to insert new history + strict padding
    if (historyInsertionIndex != null) {
      newHistoryLines.splice(historyInsertionIndex, newHistoryLines[historyInsertionIndex] === '' ? 1 : 0, '', ...md, '')
    } else if (currentHistory.startsWith('#') && currentHistory.toLowerCase().includes('history')) {
      newHistoryLines.splice(1, newHistoryLines[1] === '' ? 1 : 0, '', ...md, '')
    } else {
      newHistoryLines.unshift(...md, '')
    }

    console.log('Writing HISTORY.md in', historyPath)
    const genHis = newHistoryLines.join('\n')
    fs.writeFileSync(historyPath, genHis)

    for (const file of ['./package.json', 'setup.py', 'pyproject.toml']) {
      if (!fs.existsSync(file)) continue
      const currentManifestRaw = fs.readFileSync(file, 'utf8')
      const newManifest = currentManifestRaw.replace(manifestVersionSubstring[file], manifestVersionSubstring[file].replace(currentVersion, newVersion))
      fs.writeFileSync(file, newManifest)
      console.log('Updated', file, 'from', currentVersion, 'to', newVersion)
    }

    // See if we already have an open issue, if so, update it
    let existingPR = this.existingPR
    if (!existingPR) {
      const pr = await github.findPullRequest({ titleIncludes: 'Release ' })
      if (pr) existingPR = pr.id
    }

    // Having one branch managed by the bot prevents alot of problems (opposed to branch per version)
    const branchName = 'rel-actions-bot' // 'rel-' + Buffer.from(newVersion, 'ascii').toString('hex')
    exec(`git update-ref -d refs/heads/${branchName}`) // delete any existing branch
    exec(`git checkout -b ${branchName}`)
    exec('git add --all')
    exec('git config user.name "github-actions[bot]"')
    exec('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
    exec(`git commit -m "${releaseSeparator}${newVersion}"`)
    exec(`git push origin ${branchName} --force`)
    const title = `Release ${newVersion}`
    if (existingPR) {
      console.log('Existing PR # is', existingPR)
      await github.updatePull(existingPR, { title })
    } else {
      const body = `Triggered on behalf of ${this.triggerUser} in <a href="${this.triggerURL}">this comment</a>.\n\n<em>Note: Changes to the PR maybe needed to remove commits unrelated to library usage.</em>\n<hr/>🤖 I'm a bot. You can rename this PR or run <code>/makerelease [version]</code> again to change the version.`
      await github.createPullRequest(title, body, branchName)
    }
    return true
  },
  async fixlint () {
    if (this.type !== 'pr' && this.type !== 'pull') return
    const installCommand = github.getInput('install-command') || 'npm install'
    const lintCommand = github.getInput('/fixlint.fix-command') || 'npm run fix'

    const prInfo = await github.getPullRequest(this.triggerIssueId)

    if (!prInfo) {
      console.log('PR not found', this.triggerIssueId)
      return false
    } else {
      console.log('PR found', prInfo)
    }
    exec(`git remote add fork ${prInfo.headCloneURL}`)
    exec(`git fetch fork ${prInfo.headBranch} --depth=1`)
    exec(`git checkout -b bot-fixed-lint fork/${prInfo.headBranch}`)
    try {
      exec(installCommand)
    } catch (e) {
      await github.comment(this.triggerIssueId, `Sorry, I wasn't able to use the <code>${installCommand}</code> command to install the project because of an error.`)
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
            await github.comment(this.triggerIssueId, `I ran <code>${lintCommand}</code>, but there are errors still left that must be manually resolved:\n<pre>${log}</pre>`)
            globalThis.__testingLintError = true // test marker
          } catch (e2) {
            console.log(e2)
            await github.comment(this.triggerIssueId, `I ran <code>${lintCommand}</code>, but there are errors still left that must be manually resolved:\n<pre>${log}</pre> As the PR author didn't grant write permissions to the maintainers, the PR author must run <code>${lintCommand}</code> and manually fix the remaining errors.`)
          }
        } else {
          try {
            const ok = push()
            await github.comment(this.triggerIssueId, ok ? `I fixed all linting errors with <code>${lintCommand}</code>!` : 'No linting errors found.')
          } catch (e) {
            console.log(e)
            await github.comment(this.triggerIssueId, `I ran <code>${lintCommand}</code> which fixed the lint, but I couldn't push the changes to this branch as the PR author didn't grant write permissions to the maintainers. The PR author must manually run <code>${lintCommand}</code> and push the changes.`)
          }
        }
        resolve(true)
      })
    })
  }
}

// Roles are listed in https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment
const WRITE_ROLES = ['COLLABORATOR', 'MEMBER', 'OWNER']

github.onRepoComment(({ type, body: message, role, isAuthor, triggerPullMerged, triggerUser, triggerURL, triggerIssueId, triggerCommentId }) => {
  console.log('onRepoComment', message.startsWith('/'), WRITE_ROLES.includes(role), isAuthor)
  if (message.startsWith('/') && (WRITE_ROLES.includes(role) || isAuthor)) {
    const [command, ...args] = message.slice(1).split(' ')
    const handler = commands[command.toLowerCase()]
    if (handler) {
      // add a eyes emoji to the triggering comment
      github.addCommentReaction(triggerCommentId, 'eyes')
      const isEnabled = github.getInput(`/${command.toLowerCase()}.enabled`)
      if (isEnabled == 'false') return // eslint-disable-line eqeqeq
      return handler.apply({ type, message, role, isAuthor, triggerPullMerged, triggerUser, triggerURL, triggerIssueId, triggerCommentId }, args)
    }
  }
})

github.onUpdatedPR(({ changeType, id, isOpen, createdByUs, title }, context) => {
  if (changeType === 'title' && isOpen && createdByUs && title.old !== title.now && title.old.startsWith('Release ') && title.now.startsWith('Release ')) {
    commands.makerelease.call({ type: 'pull', existingPR: id }, title.now.replace('Release ', ''))
  }
})
