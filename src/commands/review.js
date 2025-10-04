// @ts-check
const { github } = require('../utils')

/**
 * Handles the `/review` command
 * @param {import('gh-helpers').HookOnRepoCommentPayload} ctx
 * @param {string[]} args
 * @param {string} argStr
 */
async function review (ctx, args, argStr) {
  if (ctx.type !== 'pull') return
  let owner, repo
  const servicesRepo = github.getInput('llm-services-repo')
  if (servicesRepo) {
    [owner, repo] = servicesRepo.split('/')
  } else { // if user did not specify a repo, use the current calling org's llm-services repo
    const [_owner] = ctx.repoId.split('/') // owner/repo
    owner = _owner
    repo = 'llm-services'
  }
  if (!await github.checkRepoExists([owner, repo])) {
    await github.comment(ctx.issue.number, 'Sorry, the /review command has not yet been configured for this repository.')
    return
  }
  const repoData = await github.getRepoDetails()
  const payload = {
    owner,
    repo,
    workflow: 'dispatch.yml',
    branch: 'main',
    inputs: {
      action: 'comments/review',
      payload: JSON.stringify({
        repo: repoData,
        pr: ctx.issue.number,
        action: 'comment',
        position: 'main',
        commentBody: '/review'
      })
    }
  }
  console.log('Sending request', payload)
  await github.sendWorkflowDispatch(payload)
}

module.exports = review
