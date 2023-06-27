const noop = () => { }
if (globalThis.isMocha || !process.env.GITHUB_REPOSITORY) {
  // mock a bunch of things for testing locally -- https://github.com/actions/toolkit/issues/71
  process.env.GITHUB_REPOSITORY = 'PrismarineJS/bedrock-protocol'
  process.env.GITHUB_EVENT_NAME = 'issue_comment'
  process.env.GITHUB_SHA = 'cb2fd97b6eae9f2c7fee79d5a86eb9c3b4ac80d8'
  process.env.GITHUB_REF = 'refs/heads/master'
  process.env.GITHUB_WORKFLOW = 'Issue comments'
  process.env.GITHUB_ACTION = 'run1'
  process.env.GITHUB_ACTOR = 'test-user'
  module.exports = { mock: true, getIssueStatus: noop, updateIssue: noop, createIssue: noop, getPullStatus: noop, updatePull: noop, comment: noop, createPullRequest: noop, onRepoComment: noop, onUpdatedPR: noop, repoURL: 'https://github.com/' + process.env.GITHUB_REPOSITORY }
  return
}

// const { Octokit } = require('@octokit/rest') // https://github.com/octokit/rest.js
const github = require('@actions/github')
const core = require('@actions/core')
const context = github.context

const token = process.env.GITHUB_TOKEN || core.getInput('token')
if (!token) throw new Error('No Github token was specified, please see the documentation for correct Action usage.')
const octokit = github.getOctokit(token)

async function getIssueStatus (title) {
  // https://docs.github.com/en/rest/reference/search#search-issues-and-pull-requests
  const existingIssues = await octokit.rest.search.issuesAndPullRequests({
    q: `is:issue repo:${process.env.GITHUB_REPOSITORY} in:title ${title}`
  })
  // console.log('Existing issues', existingIssues)
  const existingIssue = existingIssues.data.items.find(issue => issue.title === title)

  if (!existingIssue) return {}

  return { open: existingIssue.state === 'open', closed: existingIssue.state === 'closed', id: existingIssue.number }
}

async function updateIssue (id, payload) {
  const issue = await octokit.rest.issues.update({
    ...context.repo,
    issue_number: id,
    body: payload.body
  })
  console.log(`Updated issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
}

async function createIssue (payload) {
  const issue = await octokit.rest.issues.create({
    ...context.repo,
    ...payload
  })
  console.log(`Created issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
}

async function close (id, reason) {
  if (reason) await octokit.rest.issues.createComment({ ...context.repo, issue_number: id, body: reason })
  const issue = await octokit.rest.issues.update({ ...context.repo, issue_number: id, state: 'closed' })
  console.log(`Closed issue ${issue.data.title}#${issue.data.number}: ${issue.data.html_url}`)
}

async function comment (id, body) {
  await octokit.rest.issues.createComment({ ...context.repo, issue_number: id, body })
}

async function getDefaultBranch () {
  const { data } = await octokit.rest.repos.get({ ...context.repo })
  return data.default_branch
}

async function getPullStatus (titleIncludes, author = 'app/github-actions', status = 'open') {
  // https://docs.github.com/en/rest/reference/search#search-issues-and-pull-requests
  const q = `is:pr repo:${process.env.GITHUB_REPOSITORY} in:title ${titleIncludes} ` + (author ? `author:${author}` : '') + (status ? ` is:${status}`: '')
  const existingPulls = await octokit.rest.search.issuesAndPullRequests({
    q
  })
  console.log('Existing issue for query [', q, '] are', existingPulls.data.items)
  const existingPull = existingPulls.data.items.find(issue => issue.title.includes(titleIncludes))

  if (!existingPull) return {}

  return { open: existingPull.state === 'open', closed: existingPull.state === 'closed', id: existingPull.number }
}

async function updatePull (id, { title, body }) {
  const pull = await octokit.rest.pulls.update({
    ...context.repo,
    pull_number: id,
    title,
    body
  })
  console.log(`Updated pull ${pull.data.title}#${pull.data.number}: ${pull.data.html_url}`)
}

async function createPullRequest (title, body, fromBranch, intoBranch) {
  if (!intoBranch) {
    intoBranch = await getDefaultBranch()
  }
  await octokit.rest.pulls.create({
    ...context.repo,
    title,
    body,
    head: fromBranch,
    base: intoBranch
  })
}

function onRepoComment (fn) {
  const payload = context.payload
  if (payload.comment && payload.issue) {
    fn({
      role: payload.comment.author_association,
      body: payload.comment.body,
      type: payload.issue.pull_request ? 'pull' : 'issue',
      triggerPullMerged: payload.issue.pull_request?.merged,
      issueAuthor: payload.issue.user.login,
      triggerUser: payload.comment.user.login,
      triggerURL: payload.comment.html_url,
      isAuthor: payload.issue.user.login === payload.comment.user.login
    }, payload)
  }
}

function onUpdatedPR (fn) {
  const payload = context.payload
  if (payload.action === 'edited' && payload.pull_request && payload.changes) {
    fn({
      id: payload.pull_request.number,
      changeType: payload.changes.title ? 'title' : payload.changes.body ? 'body' : 'unknown',
      title: {
        old: payload.changes.title ? payload.changes.title.from : undefined,
        now: payload.pull_request.title
      },
      // check if created by Github Actions
      createdByUs: payload.pull_request.user.login.includes('github-actions'),
      isOpen: payload.pull_request.state === 'open'
    })
  }
}

module.exports = { getIssueStatus, updateIssue, createIssue, getPullStatus, updatePull, createPullRequest, close, comment, onRepoComment, onUpdatedPR, repoURL: 'https://github.com/' + process.env.GITHUB_REPOSITORY }
