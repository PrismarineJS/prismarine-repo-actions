/* eslint-env mocha */
const cp = require('child_process')
const fs = require('fs')
const { join } = require('path')
globalThis.isMocha = true

describe('commands work', () => {
  const github = require('gh-helpers')()
  let commentCb
  github.onRepoComment = (fn) => {
    commentCb = fn
  }
  require('../src/index')
  cp.execSync(`git checkout ${__dirname}/history-in-readme-mock ${__dirname}/normal`) // eslint-disable-line

  beforeEach(done => setTimeout(done, 500))
  afterEach(() => {
    process.chdir(join(__dirname, '..'))
  })

  it('/makerelease with no args', (done) => {
    process.chdir(join(__dirname, 'normal'))
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
    }).catch(console.error)
  })

  it('/makerelease with args', (done) => {
    process.chdir(join(__dirname, 'normal'))
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

  it('/makerelease with no perms', (done) => {
    process.chdir(join(__dirname, 'normal'))
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
  }).timeout(500)

  it('/makerelease with history in README', (done) => {
    process.chdir(join(__dirname, 'history-in-readme-mock'))
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
    }).catch(console.error)
  }).timeout(500)

  it('/makerelease with python setup.py', (done) => {
    process.chdir(join(__dirname, 'python'))
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
    }).catch(console.error)
  }).timeout(500)

  it('/fixlint with no errors', (done) => {
    commentCb({
      type: 'pr',
      role: 'COLLABORATOR',
      body: '/fixlint',
      triggerPullMerged: true,
      issueUser: 'extremeheat',
      triggerUser: 'extremeheat',
      triggerURL: '',
      isAuthor: true
    }).then((res) => {
      console.log('CB called')
      if (res) done()
      else done(Error('failed'))
    })
  }).timeout(6000)

  it('/fixlint with expected errors', (done) => {
    fs.writeFileSync('broken.js', 'let x')
    commentCb({
      type: 'pr',
      role: 'COLLABORATOR',
      body: '/fixlint',
      triggerPullMerged: true,
      issueUser: 'extremeheat',
      triggerUser: 'extremeheat',
      triggerURL: '',
      isAuthor: true
    }).then((res) => {
      fs.rmSync('broken.js')
      if (res) {
        if (globalThis.__testingLintError) done()
        else done(Error('lint error not thrown'))
      } else {
        done(Error('failed'))
      }
    })
  }).timeout(6000)
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

after(() => {
  console.log('Done with tests, resetting test/ changes')
  cp.execSync('git checkout history-in-readme-mock', { cwd: __dirname })
  cp.execSync('git checkout normal', { cwd: __dirname })
  cp.execSync('git checkout python', { cwd: __dirname })
})
