const co = require('co')
const moment = require('moment')
const CronJob = require('cron').CronJob
const Media = require('../../../db/media')

function GC() {

  this.run = async function () {
    await Media.update({
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
  onTick: co.wrap(async function () {
    await (new GC).run()
  }),
  start: process.env.pm_id? (process.env.pm_id == 0? true: false): true
})
