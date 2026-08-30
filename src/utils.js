// @ts-check
const cp = require('child_process')
const fs = require('fs')
const github = require('gh-helpers')()

// Runs a program directly (no shell), so arguments are never interpreted by a shell
const exec = (file, args = []) => {
  console.log('> ', file, ...args)
  if (!github.mock) cp.execFileSync(file, args, { stdio: 'inherit' })
}

function findFile (tryPaths) {
  const path = tryPaths.find(path => fs.existsSync(path))
  return [path, fs.readFileSync(path, 'utf-8')]
}

// Roles are listed in https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#issue_comment
const WRITE_ROLES = ['COLLABORATOR', 'MEMBER', 'OWNER']

module.exports = { exec, findFile, WRITE_ROLES, github }
