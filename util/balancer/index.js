'use strict'

const _ = require('underscore')
const config = require('../../config.json')

// list of all cdn
const cdn = config.service.downloader.cdn

// current cdn id, default to 0
let current = 0

module.exports = function* (serverId) {

  if (serverId != null)
  {
    let server = _.find(cdn, (item) => {
      return item.id == serverId
    })

    if (server != null)
      return server
  }

  if (process.env.NODE_ENV != 'production')
    return { id: 'sl', url: 'http://127.0.0.1:19001' }

  current = (current + 1) % cdn.length
  return cdn[current]
}
