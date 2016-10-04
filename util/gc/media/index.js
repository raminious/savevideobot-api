'use strict'

const co = require('co')
const moment = require('moment')
const CronJob = require('cron').CronJob
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

/**
 * cronjob for downserver check
 */
new CronJob({
  cronTime: '00 00 12 * * *',
  onTick: co.wrap(function* () {
    yield (new GC).run()
  }),
  start: true
})
