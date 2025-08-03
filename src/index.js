// @ts-check
/* eslint-disable no-empty-pattern, no-unreachable */
const { WRITE_ROLES, github } = require('./utils')
const commands = require('./commands')

github.onRepoComment((comment) => {
  const message = comment.body
  console.log('onRepoComment', message.startsWith('/'), WRITE_ROLES.includes(comment.role), comment)
  if (message.startsWith('/') && (WRITE_ROLES.includes(comment.role) || comment.isAuthor)) {
    const [command, ...args] = message.slice(1).split(' ')
    const handler = commands[command.toLowerCase()]
    if (handler) {
      // add a eyes emoji to the triggering comment
      github.addCommentReaction(comment.id, 'eyes')
      const isEnabled = github.getInput(`/${command.toLowerCase()}.enabled`)
      if (handler.requiresExplicitEnable && isEnabled !== 'true') return
      if (isEnabled === 'false') return
      return handler.apply(comment, [args, args.join(' ')])
    }
  }
})
