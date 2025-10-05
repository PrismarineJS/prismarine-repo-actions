// @ts-check
const { WRITE_ROLES, github } = require('./utils')

const commands = {
  makerelease: require('./commands/makerelease'),
  fixlint: require('./commands/fixlint'),
  ai: require('./commands/ai')
}

github.onRepoComment((/** @type {import('gh-helpers').HookOnRepoCommentPayload & { authorHasWrite?: boolean }} */ comment) => {
  const message = comment.body
  comment.authorHasWrite = WRITE_ROLES.includes(comment.role)
  console.log('onRepoComment', message.startsWith('/'), comment.authorHasWrite, comment)
  if (message.startsWith('/') && (comment.authorHasWrite || comment.isAuthor)) {
    const [command, ...args] = message.slice(1).split(' ')
    const handler = commands[command.toLowerCase()]
    if (handler) {
      // add a eyes emoji to the triggering comment
      github.addCommentReaction(comment.id, 'eyes')
      const isEnabled = github.getInput(`/${command.toLowerCase()}.enabled`)
      if (handler.requiresExplicitEnable && isEnabled !== 'true') return
      if (isEnabled === 'false') return
      return handler(comment, args, args.join(' '))
    }
  }
})
