/* eslint-env mocha */
const cp = require('child_process')
const fs = require('fs')
globalThis.isMocha = true

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
    this.timeout(5000)
    cp.execSync('npm run build -- -o test')
    const a = fs.readFileSync('test/index.js', 'utf-8').split(/\r?\n/).join('')
    const b = fs.readFileSync('dist/index.js', 'utf-8').split(/\r?\n/).join('')
    if (a === b) {
      fs.rmSync('test/index.js')
    } else {
      fs.rmSync('test/index.js')
      console.log('expected, actual build', a.length, b.length)
      throw Error('dist/ is out of sync, run `npm run build`')
    }
  })
})
