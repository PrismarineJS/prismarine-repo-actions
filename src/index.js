const cp = require('child_process')
const fs = require('fs')
const github = require('./github')

const exec = (cmd) => github.mock ? console.log('> ', cmd) : (console.log('> ', cmd), cp.execSync(cmd, { stdio: 'inherit' }))
function findFile (tryPaths) {
  const path = tryPaths.find(path => fs.existsSync(path))
  return [path, fs.readFileSync(path, 'utf-8')]
}

const commands = {
  async makerelease (newVersion) {
    // Make sure we were triggered in a PR.
    if (this.type !== 'pr' && this.type !== 'pull') return

    const defaultBranch = await github.getDefaultBranch()
    exec(`git fetch origin ${defaultBranch} --depth 16`)
    exec(`git checkout ${defaultBranch}`)

    const [historyPath, currentHistory] = findFile(['HISTORY.md', 'history.md', './docs/history.md', './docs/HISTORY.md', './doc/history.md', './doc/HISTORY.md'])

    let currentVersion
    // Node.js
    if (fs.existsSync('./package.json')) {
      const currentManifestRaw = fs.readFileSync('./package.json', 'utf8')
      currentVersion = JSON.parse(currentManifestRaw).version
    }
    // Python (setup.py)
    if (fs.existsSync('setup.py')) {
      const currentManifestRaw = fs.readFileSync('setup.py', 'utf8')
      currentVersion = currentManifestRaw.match(/version="(.*)"/)[1]
    }
    // Python (pyproject.toml)
    if (fs.existsSync('pyproject.toml')) {
      const currentManifestRaw = fs.readFileSync('pyproject.toml', 'utf8')
      currentVersion = currentManifestRaw.match(/version = "(.*)"/)[1]
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
          } else if (header[0].isNumeric()) {
            currentVersion = header
            break
          }
        }
      }
      if (!currentVersion) {
        await github.comment(this.triggerIssueId, "Sorry, I couldn't find the current version.")
        return
      }
    }

    if (!newVersion) {
      const x = currentVersion.split('.')
      x[1]++
      newVersion = x.join('.')
    }

    const newHistoryLines = currentHistory.split('\n')
    const latestCommits = cp.execSync('git log --pretty=format:"%H~~~%an~~~%s" -n 40')
      .toString().split('\n').map(e => e.split('~~~').map(e => e.replace(/</g, '&gt;')))
    console.log('Latest commits', latestCommits.map(e => e.join(', ')))
    if (!latestCommits.length) {
      await github.comment(this.triggerIssueId, "Sorry, I couldn't find any commits since the last release.")
      return
    }
    const md = [`\n${newHistoryLines.some(l => l.startsWith('### ')) ? '###' : '##'} ${newVersion}`]

    for (const [hash, user, message] of latestCommits) {
      if (message.startsWith('Release ')) break
      else md.push(`* [${message}](${github.repoURL}/commit/${hash}) (thanks @${user})`)
    }

    if (currentHistory.startsWith('#') && currentHistory.toLowerCase().includes('history')) {
      newHistoryLines.splice(1, 0, ...md)
    } else {
      newHistoryLines.unshift(...md)
    }

    console.log('Writing HISTORY.md in', historyPath)
    const genHis = newHistoryLines.join('\n').replace(/\n\n\n/g, '\n\n')
    // console.log(genHis)
    fs.writeFileSync(historyPath, genHis)

    // Node.js
    if (fs.existsSync('./package.json')) {
      const currentManifestRaw = fs.readFileSync('./package.json', 'utf8')
      const newManifest = currentManifestRaw.replace(`"version": "${currentVersion}"`, `"version": "${newVersion}"`)
      fs.writeFileSync('package.json', newManifest)
      console.log('Updated package.json from', currentVersion, 'to', newVersion)
    }
    // Python (setup.py)
    if (fs.existsSync('setup.py')) {
      const currentManifestRaw = fs.readFileSync('setup.py', 'utf8')
      const newManifest = currentManifestRaw.replace(`version="${currentVersion}"`, `version="${newVersion}"`)
      fs.writeFileSync('setup.py', newManifest)
      console.log('Updated setup.py from', currentVersion, 'to', newVersion)
    }
    // Python (pyproject.toml)
    if (fs.existsSync('pyproject.toml')) {
      const currentManifestRaw = fs.readFileSync('pyproject.toml', 'utf8')
      const newManifest = currentManifestRaw.replace(`version = "${currentVersion}"`, `version = "${newVersion}"`)
      fs.writeFileSync('pyproject.toml', newManifest)
      console.log('Updated pyproject.toml from', currentVersion, 'to', newVersion)
    }

    // See if we already have an open issue, if so, update it
    let existingPR = this.existingPR
    if (!existingPR) {
      const pr = await github.getPullStatus('Release ')
      if (pr) existingPR = pr.id
    }

    // Having one branch managed by the bot prevents alot of problems (opposed to branch per version)
    const branchName = 'rel-actions-bot' // 'rel-' + Buffer.from(newVersion, 'ascii').toString('hex')
    exec(`git update-ref -d refs/heads/${branchName}`) // delete any existing branch
    exec(`git checkout -b ${branchName}`)
    exec('git add --all')
    exec('git config user.name "github-actions[bot]"')
    exec('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
    exec(`git commit -m "Release ${newVersion}"`)
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
    const lintCommand = github.getInput('/fixlint.fix-command') || 'npm run fix'
    function push () {
      exec('git add --all')
      exec('git config user.name "github-actions[bot]"')
      exec('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"')
      try {
        exec('git commit -m "Fix linting errors"')
      } catch (e) {
        // No changes
        return false
      }
      exec('git push')
      return true
    }
    try {
      const stdout = cp.execSync(lintCommand)
      console.log(stdout.toString())
      try {
        const ok = push()
        await github.comment(this.triggerIssueId, ok ? `I fixed all linting errors with \`${lintCommand}\`!` : 'No linting errors found.')
      } catch (e) {
        await github.comment(this.triggerIssueId, `I ran \`${lintCommand}\` which fixed the lint, but I couldn't push the changes to this branch as the PR author didn't grant write permissions to the maintainers. The PR author must manually run \`${lintCommand}\` and push the changes.`)
      }
    } catch (e) {
      const log = e.stdout.toString()
      try {
        push()
        await github.comment(this.triggerIssueId, `I ran \`${lintCommand}\`, but there are errors still left that must be manually resolved:\n<pre>${log}</pre> As the PR author didn't grant write permissions to the maintainers, the PR author must run \`${lintCommand}\` and manually fix the remaining errors.`)
        globalThis.__testingLintError = true // test marker
      } catch (e2) {
        await github.comment(this.triggerIssueId, `I ran \`${lintCommand}\`, but there are errors still left that must be manually resolved:\n<pre>${log}</pre>`)
      }
    }
    return true
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
  if (changeType === 'title' && isOpen && createdByUs && title.old.startsWith('Release ') && title.now.startsWith('Release ')) {
    commands.makerelease.call({ type: 'pull', existingPR: id }, title.now.replace('Release ', ''))
  }
})
