// @ts-check
const { github } = require('../utils')

/**
 * Handles the `/review` command
 * @this {import('gh-helpers').HookOnRepoCommentPayload}
 */
async function review () {
  if (this.type !== 'pull') return
  let owner, repo
  const servicesRepo = github.getInput('llm-services-repo')
  if (servicesRepo) {
    [owner, repo] = servicesRepo.split('/')
  } else { // if user did not specify a repo, use the current calling org's llm-services repo
    const [_owner] = this.repoId.split('/') // owner/repo
    owner = _owner
    repo = 'llm-services'
  }
  if (!await github.checkRepoExists([owner, repo])) {
    await github.comment(this.issue.number, 'Sorry, the /review command has not yet been configured for this repository.')
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
        pr: this.issue.number,
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
