// @ts-check
const cp = require('child_process')
const fs = require('fs')
const github = require('gh-helpers')()

const exec = (cmd) => github.mock ? console.log('> ', cmd) : (console.log('> ', cmd), cp.execSync(cmd, { stdio: 'inherit' }))

function findFile (tryPaths) {
  const path = tryPaths.find(path => fs.existsSync(path))
  return [path, fs.readFileSync(path, 'utf-8')]
}

// Roles are listed in https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment
const WRITE_ROLES = ['COLLABORATOR', 'MEMBER', 'OWNER']

module.exports = {
  exec,
  findFile,
  WRITE_ROLES,
  github,
  cp,
  fs
}
