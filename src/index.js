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
    const defaultBranch = await github.getDefaultBranch()
    exec(`git fetch ${defaultBranch} --depth 16`)
    exec(`git checkout ${defaultBranch}`)
    const currentManifestRaw = fs.readFileSync('./package.json', 'utf8')
    const currentVersion = JSON.parse(currentManifestRaw).version
    const [historyPath, currentHistory] = findFile(['HISTORY.md', 'history.md', './docs/history.md', './docs/HISTORY.md', './doc/history.md', './doc/HISTORY.md'])

    // Make sure we were triggered in a PR. If there was a triggering PR
    if (this.type !== 'pr' && this.type !== 'pull') return
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
      github.comment("Sorry, I couldn't find any commits since the last release.")
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

    const newManifest = currentManifestRaw.replace(`"version": "${currentVersion}"`, `"version": "${newVersion}"`)
    fs.writeFileSync('package.json', newManifest)
    console.log('Updated package.json from', currentVersion, 'to', newVersion)

    // See if we already have an open issue, if so, update it
    let existingPR = this.existingPR
    if (!existingPR) {
      const pr = await github.getPullStatus('Release ')
      if (pr) existingPR = pr.number
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
      github.updatePull(existingPR, { title })
    } else {
      const body = `Triggered on behalf of ${this.triggerUser} in <a href="${this.triggerURL}">this comment</a>.\n\n<em>Note: Changes to the PR maybe needed to remove commits unrelated to library usage.</em>\n<hr/>🤖 I'm a bot. You can rename this PR or run <code>/makerelease [version]</code> again to change the version.`
      github.createPullRequest(title, body, branchName)
    }
    return true
  }
}

// Roles are listed in https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment
const WRITE_ROLES = ['COLLABORATOR', 'MEMBER', 'OWNER']

github.onRepoComment(({ type, body: message, role, isAuthor, triggerPullMerged, triggerUser, triggerURL }) => {
  console.log('onRepoComment', message.startsWith('/'), WRITE_ROLES.includes(role), isAuthor)
  if (message.startsWith('/') && (WRITE_ROLES.includes(role) || isAuthor)) {
    const [command, ...args] = message.slice(1).split(' ')
    const handler = commands[command]
    if (handler) {
      return handler.apply({ type, message, role, isAuthor, triggerPullMerged, triggerUser, triggerURL }, args)
    }
  }
})

github.onUpdatedPR(({ changeType, id, isOpen, createdByUs, title }, context) => {
  if (changeType === 'title' && isOpen && createdByUs && title.old.startsWith('Release ') && title.now.startsWith('Release ')) {
    commands.makerelease.call({ type: 'pull', existingPR: id }, title.now.replace('Release ', ''))
  }
})
