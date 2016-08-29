'use strict'

const _ = require('underscore')
const config = require('../../../config.json')
const words = config.restrict.words

module.exports = function() {

  for (let arg in arguments) {
    let input = arguments[arg].toLowerCase()

    const find = _.some(words, w => {
      return input.match(w) != null
    })

    if (find) return true
  }

  return false
}
