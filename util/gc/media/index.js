'use strict'

const co = require('co')
const moment = require('moment')
const Media = require('svb-core/lib/media')

function GC() {

  this.run = function* () {
    yield Media.update({
      expire_at: { $lt: moment().format()}
    }, {
      download: '',
      formats: []
    })

    process.exit()
  }
}

co(function*() {
  yield (new GC).run()
})



