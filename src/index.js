const cp = require('child_process')
const fs = require('fs')
const github = require('./github')

const findFile = (tryPaths) => fs.readFileSync(tryPaths.find(path => fs.existsSync(path)), 'utf-8')
const repoURL = github.repoURL
const currentManifestRaw = fs.readFileSync('./package.json', 'utf8')
const currentVersion = JSON.parse(currentManifestRaw).version
const currentHistory = findFile(['HISTORY.md', 'history.md', './docs/history.md', './docs/HISTORY.md', './doc/history.md', './doc/HISTORY.md'])

const commands = {
  makerelease (newVersion) {
    if (!newVersion) {
      const x = currentVersion.split('.')
      x[1]++
      newVersion = x.join('.')
    }
    const newHistoryLines = currentHistory.split('\n')
    const latestCommits = cp.execSync('git log --pretty=format:"%H~~~%an~~~%s" -n 40')
      .toString().split('\n').map(e => e.split('~~~'))
    console.log('Latest commits', latestCommits)
    const md = [`\n${newHistoryLines.some(l => l.startsWith('### ')) ? '###' : '##'} ${newVersion}`]

    for (const [hash, user, message] of latestCommits) {
      if (message.startsWith('Release ')) break
      else md.push(`* [${message}](${repoURL}/commit/${hash}) (thanks @${user})`)
    }

    if (currentHistory.startsWith('#') && currentHistory.toLowerCase().includes('history')) {
      newHistoryLines.splice(1, 0, ...md)
    } else {
      newHistoryLines.unshift(...md)
    }

    console.log('Writing markdown:')
    console.log(newHistoryLines.join('\n').replace(/\n\n\n/g, '\n\n'))

    const newManifest = currentManifestRaw.replace(`"version": "${currentVersion}"`, `"version": "${newVersion}"`)
    fs.writeFileSync('package.json', newManifest)
    console.log('Updated package.json from', currentVersion, 'to', newVersion)
  }
}

github.onRepoComment(({ body: message, role, isAuthor }) => {
  // Roles are listed in https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment
  const ALLOWED_ROLES = ['COLLABORATOR', 'MEMBER', 'OWNER']
  if (message.startsWith('/') && (ALLOWED_ROLES.includes(role) || isAuthor)) {
    const [command, ...args] = message.slice(1).split(' ')
    const handler = commands[command]
    if (handler) {
      handler(...args)
    }
  }
})

if (!module.parent) {
  commands.makerelease()
}
