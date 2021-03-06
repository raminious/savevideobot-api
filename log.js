'use strict'

const agent = require('superagent')
const config = require('./config.json')

module.exports = function (level, message, info) {

  agent
  .post('http://log.savevideobot.com/store/')
  .auth('ramin', '@1ir3z4', { type: 'auto' })
  .send({
    level,
    short_message: message,
    from: 'api'
  })
  .send(info)
  .end((err, res) => {})
}

