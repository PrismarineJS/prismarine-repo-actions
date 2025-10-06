// @ts-check
const { github } = require('../utils')

/**
 * Handles the `/ai <prompt>` command
 * @param {import('gh-helpers').HookOnRepoCommentPayload} ctx
 * @param {string[]} args
 * @param {string} argStr
 */
async function ai (ctx, args, argStr) {
  if (!argStr || argStr.trim() === '') {
    await github.comment(ctx.issue.number, 'Please provide a prompt for the AI agent. Usage: `/ai <prompt>`')
    return false
  }

  const prompt = `Related: ${ctx.issue.url}\n\n${argStr}`
  let branch

  // If this is a PR, add the PR URL as context
  if (ctx.type === 'pull') {
    const prInfo = await github.getPullRequest(ctx.issue.number)
    if (!prInfo) {
      console.log('PR not found', ctx.issue.number)
      await github.comment(ctx.issue.number, 'Sorry, I could not retrieve the pull request information.')
      return false
    }
    // Check if both source and target branches are in the same repo
    if (prInfo.targetRepo === prInfo.headRepo) {
      // Use the source branch (head branch)
      branch = prInfo.headBranch
      console.log(`Using source branch: ${branch}`)
    }
  }

  try {
    console.log(`Creating agent task with prompt [${prompt}]`)
    if (branch) {
      console.log(`On branch: ${branch}`)
    }

    const result = await github.createAgent(prompt, branch)
    console.log('Agent task created:', result)

    await github.comment(ctx.issue.number, '✅ Agent task created successfully!')
    return true
  } catch (error) {
    console.error('Error creating agent task:', error)
    await github.comment(ctx.issue.number, `❌ Failed to create agent task: ${error.message}`)
    return false
  }
}

module.exports = ai
