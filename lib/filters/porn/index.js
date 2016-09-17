'use strict'

const _ = require('underscore')
const config = require('../../../config.json')
const words = config.restrict.words

module.exports = function (site, title, url) {

  let find = false
  const inputs = [site, title]

  for (let i in inputs) {

    // prepare input
    let input = inputs[i].toLowerCase()

    find = _.some(words, w => {
      return input.match(w) != null
    })

    if (find) break
  }

  // log porn requests
  if (find) {
    this.log('report', 'porn', { site, title, url})
  }

  this.assert(!find, 406, 'We are so sorry, You are not able to download pornographic contents')
}
