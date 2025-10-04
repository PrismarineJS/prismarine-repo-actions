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
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/makerelease',
      username: 'superbot',
      url: '',
      isAuthor: true,
      issue: {
        author: 'superbot',
        isMerged: true
      }
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    }).catch(console.error)
  })

  it('/makerelease with args', (done) => {
    process.chdir(join(__dirname, 'normal'))
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/makerelease 2.0.0',
      username: 'superbot',
      url: '',
      isAuthor: true,
      issue: {
        author: 'superbot',
        isMerged: true
      }
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    })
  }).timeout(500)

  it('/makerelease with no perms', (done) => {
    process.chdir(join(__dirname, 'normal'))
    const shouldBeFalse = commentCb({
      type: 'pull',
      role: '',
      body: '/makerelease 2.0.0',
      username: 'NOTsuperbot',
      url: '',
      isAuthor: false,
      issue: {
        author: 'superbot',
        isMerged: true
      }
    })
    console.log('Should be false', shouldBeFalse)
    if (shouldBeFalse) throw Error('failed')
    done()
  }).timeout(500)

  it('/makerelease with history in README', (done) => {
    process.chdir(join(__dirname, 'history-in-readme-mock'))
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/makerelease 2.0.0',
      username: 'superbot',
      url: '',
      isAuthor: true,
      issue: {
        author: 'superbot',
        isMerged: true
      }
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    }).catch(console.error)
  }).timeout(500)

  it('/makerelease with python setup.py', (done) => {
    process.chdir(join(__dirname, 'python'))
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/makerelease 2.0.0',
      username: 'superbot',
      url: '',
      isAuthor: true,
      issue: {
        author: 'superbot',
        isMerged: true
      }
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    }).catch(console.error)
  }).timeout(500)

  it('/fixlint with no errors', (done) => {
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/fixlint',
      username: 'superbot',
      url: '',
      isAuthor: true,
      issue: {
        author: 'superbot',
        isMerged: true
      }
    }).then((res) => {
      console.log('CB called')
      if (res) done()
      else done(Error('failed'))
    })
  }).timeout(6000)

  it('/fixlint with expected errors', (done) => {
    fs.writeFileSync('broken.js', 'let x')
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/fixlint',
      username: 'superbot',
      url: '',
      isAuthor: true,
      issue: {
        author: 'superbot',
        isMerged: true
      }
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

  it('/ai with prompt', (done) => {
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/ai fix the tests',
      username: 'superbot',
      url: 'https://github.com/test/repo/pull/1#issuecomment-123',
      isAuthor: true,
      issue: {
        number: 1,
        author: 'superbot',
        isMerged: false
      }
    }).then((res) => {
      if (res) done()
      else done(Error('failed'))
    }).catch(console.error)
  }).timeout(500)

  it('/ai with no prompt', (done) => {
    commentCb({
      type: 'pull',
      role: 'COLLABORATOR',
      body: '/ai',
      username: 'superbot',
      url: 'https://github.com/test/repo/pull/1#issuecomment-123',
      isAuthor: true,
      issue: {
        number: 1,
        author: 'superbot',
        isMerged: false
      }
    }).then((res) => {
      if (!res) done()
      else done(Error('should have failed with no prompt'))
    }).catch(console.error)
  }).timeout(500)

  it('/ai with no perms', (done) => {
    const shouldBeFalse = commentCb({
      type: 'pull',
      role: '',
      body: '/ai fix the tests',
      username: 'NOTsuperbot',
      url: 'https://github.com/test/repo/pull/1#issuecomment-123',
      isAuthor: false,
      issue: {
        number: 1,
        author: 'superbot',
        isMerged: false
      }
    })
    console.log('Should be false', shouldBeFalse)
    if (shouldBeFalse) throw Error('failed')
    done()
  }).timeout(500)
})

describe('build checks', function () {
  it('build is up to date', function () {
    this.timeout(5000 * 2)
    cp.execSync('npm run build -- -o test')
    const a = fs.readFileSync('test/index.js', 'utf-8').replaceAll('\r', '')
    const b = fs.readFileSync('dist/index.js', 'utf-8').replaceAll('\r', '')
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
