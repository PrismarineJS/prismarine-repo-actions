// @ts-check
const makerelease = require('./makerelease')
const fixlint = require('./fixlint')
const review = require('./review')
const mergeonpass = require('./mergeonpass')

module.exports = {
  makerelease,
  fixlint,
  review,
  mergeonpass
}
