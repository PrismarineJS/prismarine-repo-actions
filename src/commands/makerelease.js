// @ts-check
const { exec, findFile, github, fs } = require('../utils')

/**
 * Handles the `/makerelease [newVersion]` command
 * @this {import('gh-helpers').HookOnRepoCommentPayload}
 */
async function makerelease ([newVersion]) {
  const releaseSeparator = github.getInput('/makerelease.releaseCommitsStartWith') || 'Release '
  const maxListedCommits = parseInt(github.getInput('/makerelease.maxListedCommits')) || 32

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
      await github.comment(this.issue.number, "Sorry, I couldn't find the current version.")
      return
    }
    console.log('Current version is', currentVersion)
  }

  if (!newVersion) {
    const x = currentVersion.split('.')
    x[1]++
    x[2] = 0
    newVersion = x.join('.')
  } else if (newVersion === 'patch') {
    const x = currentVersion.split('.')
    x[2] ??= 0
    x[2]++
    newVersion = x.join('.')
  }

  const newHistoryLines = currentHistory.split('\n')
  const latestCommits = await github.getRecentCommitsInRepo(maxListedCommits)
  console.log('Latest commits', latestCommits)
  if (!latestCommits.length) {
    await github.comment(this.issue.number, "Sorry, I couldn't find any commits since the last release.")
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
  let existingPR
  const pr = await github.findPullRequest({ titleIncludes: 'Release ' })
  if (pr) existingPR = pr.id

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
    const body = `Triggered on behalf of ${this.username} in <a href="${this.url}">this comment</a>.\n\n<em>Note: Changes to the PR maybe needed to remove commits unrelated to library usage.</em>\n<hr/>🤖 I'm a bot. You can run <code>/makerelease [version]</code> again to change the version.`
    await github.createPullRequest(title, body, branchName)
  }
  return true
}

module.exports = makerelease
