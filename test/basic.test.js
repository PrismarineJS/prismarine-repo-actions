/* eslint-env mocha */
const cp = require('child_process')
const fs = require('fs')

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

describe('build checks', function () {
  it('build is up to date', function () {
    cp.execSync('npm run build -- -o test')
    if (fs.statSync('test/index.js').size === fs.statSync('dist/index.js').size) {
      fs.rmSync('test/index.js')
    } else {
      fs.rmSync('test/index.js')
      throw Error('dist/ is out of sync, run `npm run build`')
    }
  })
})
