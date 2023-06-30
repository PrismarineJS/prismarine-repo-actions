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
  const getPullRequest = () => ({
    canMaintainerModify: true,
    targetBranch: 'target',
    targetRepo: 'target-repo',
    headBranch: 'head',
    headRepo: 'head-repo',
    headCloneURL: 'clone-url',
  })
  const getRecentCommitsInRepo = () => [
    {
      sha: '02d67b22e1ba8e354d8ec856b17000ffbc5144a1',
      login: 'github-actions',
      name: 'github-actions[bot]',
      email: 'github-actions[bot]@users.noreply.github.com',
      message: 'Update README.md',
      url: 'https://github.com/PrismarineJS/mineflayer/commit/02d67b22e1ba8e354d8ec856b17000ffbc5144a1'
    },
    {
      sha: 'c6e8aa895fd112876c0733f0b99bc3c2e3efc7c0',
      login: 'github-actions',
      name: 'github-actions[bot]',
      email: 'github-actions[bot]@users.noreply.github.com',
      message: 'Update workflow',
      url: 'https://github.com/PrismarineJS/mineflayer/commit/c6e8aa895fd112876c0733f0b99bc3c2e3efc7c0'
    },
  ]
  module.exports = { mock: true, getDefaultBranch: () => 'master', getInput: noop, getIssueStatus: noop, updateIssue: noop, createIssue: noop, getPullRequest, findPullRequest: noop, updatePull: noop, comment: console.log, createPullRequest: noop, addCommentReaction: noop, getRecentCommitsInRepo, onRepoComment: noop, onUpdatedPR: noop, repoURL: 'https://github.com/' + process.env.GITHUB_REPOSITORY }
  return
}

// const { Octokit } = require('@octokit/rest') // https://github.com/octokit/rest.js
const github = require('@actions/github')
const core = require('@actions/core')
const context = github.context

const token = process.env.GITHUB_TOKEN || core.getInput('token')
if (!token) throw new Error('No Github token was specified, please see the documentation for correct Action usage.')
const octokit = github.getOctokit(token)

const getInput = (name, required = false) => core.getInput(name, { required })

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

function getDefaultBranch () {
  // const { data } = await octokit.rest.repos.get({ ...context.repo })
  // return data.default_branch
  return context.payload.repository.default_branch
}

console.log('Default branch is', getDefaultBranch())

async function findPullRequest (titleIncludes, author = '@me', status = 'open') {
  // https://docs.github.com/en/rest/reference/search#search-issues-and-pull-requests
  const q = `is:pr repo:${process.env.GITHUB_REPOSITORY} in:title ${titleIncludes} ` + (author ? `author:${author}` : '') + (status ? ` is:${status}`: '')
  const existingPulls = await octokit.rest.search.issuesAndPullRequests({ q })
  console.log('Existing issue for query [', q, '] are', existingPulls.data.items)
  const existingPull = existingPulls.data.items.find(issue => issue.title.includes(titleIncludes))

  if (!existingPull) return {}
  console.log('Found PR #', existingPull.number)
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

async function getPullRequest (id) {
  const { data } = await octokit.rest.pulls.get({
    ...context.repo,
    pull_number: id
  })
  return {
    canMaintainerModify: data.maintainer_can_modify || (data.base.repo.full_name === data.head.repo.full_name),
    targetBranch: data.base.ref,
    targetRepo: data.base.repo.full_name,
    headBranch: data.head.ref,
    headRepo: data.head.repo.full_name,
    headCloneURL: data.head.repo.clone_url,
    title: data.title,
    body: data.body,
    state: data.state,
    number: data.number,
    url: data.html_url
  }
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

async function addCommentReaction (commentId, reaction) {
  await octokit.rest.reactions.createForIssueComment({
    ...context.repo,
    comment_id: commentId,
    content: reaction
  })
}

async function getRecentCommitsInRepo (max=100) {
  const { data } = await octokit.rest.repos.listCommits({
    ...context.repo,
    per_page: max
  })
  return data.map(commit => ({
    sha: commit.sha,
    login: commit.author?.login,
    name: commit.commit.author.name,
    email: commit.commit.author.email,
    message: commit.commit.message,
    url: commit.html_url
  }))
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
      triggerIssueId: payload.issue.number,
      triggerCommentId: payload.comment.id,
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

module.exports = { getDefaultBranch, getInput, getIssueStatus, updateIssue, createIssue, findPullRequest, getPullRequest, updatePull, createPullRequest, close, comment, addCommentReaction, getRecentCommitsInRepo, onRepoComment, onUpdatedPR, repoURL: context.payload.repository.html_url }
