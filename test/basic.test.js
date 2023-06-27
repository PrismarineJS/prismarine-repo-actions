/* eslint-env mocha */

describe('commands work', () => {
  const github = require('../src/github')
  let commentCb
  github.onRepoComment = (fn) => {
    commentCb = fn
  }
  require('../src/index')

  it('makerelease with no args', (done) => {
    commentCb({
      type: 'pr',
      role: 'COLLABORATOR',
      body: '/makerelease',
      triggerPullMerged: true,
      issueUser: 'extremeheat',
      triggerUser: 'extremeheat',
      triggerURL: '',
      isAuthor: true
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    })
  })

  it('makerelease with args', (done) => {
    commentCb({
      type: 'pr',
      role: 'COLLABORATOR',
      body: '/makerelease 2.0.0',
      triggerPullMerged: true,
      issueUser: 'extremeheat',
      triggerUser: 'extremeheat',
      triggerURL: '',
      isAuthor: true
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    })
  }).timeout(500)

  it('makerelease with no perms', (done) => {
    const shouldBeFalse = commentCb({
      type: 'pr',
      role: '',
      body: '/makerelease 2.0.0',
      triggerPullMerged: true,
      issueUser: 'extremeheat',
      triggerUser: 'extremeheat',
      triggerURL: '',
      isAuthor: false
    })
    if (shouldBeFalse) throw Error('failed')
    done()
  }).timeout(1000)
})
