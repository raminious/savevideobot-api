'use strict'

const _ = require('underscore')
const co = require('co')
const moment = require('moment')
const CronJob = require('cron').CronJob
const config = require('../../config.json')

const agent = require('superagent')
require('superagent-retry')(agent)

const report = require('../../admin/report/telegram')

// list of all cdn
const cdn = []
const monitor = {}

// recreate list depend on servers weight
_.each(config.service.downloader.cdn, server => {
  for (let i = 1; i <= (server.weight || 1); i++)
    cdn.push({ id: server.id, url: server.url, active: true })

  monitor[server.id] = { down: 0, downfrom: 0 }
})

// current cdn id, default to 0
let current = 0

const balancer = {}

/*
 * Return the server at top of the list and turn it over
 */
balancer.pop = function* (serverId) {

  // filter active servers
  const list = _.filter(cdn, server => server.active == true )

  if (serverId != null)
  {
    let server = _.find(list, (item) => {
      return item.id == serverId
    })

    if (server != null)
      return server
  }

  if (process.env.NODE_ENV != 'production')
    return { id: 's1', url: 'http://127.0.0.1:19001' }

  current = (current + 1) % list.length
  return list[current]
}

/*
 * mark server as down
 */
balancer.down = function* (serverId) {

  // increase down counter
  monitor[serverId].down++

  // disable servers that not response for two times in one minutes (why one? see cronjob)
  if (monitor[serverId].down > 2) {

    // set downtime
    monitor[serverId].downfrom = moment().format()

    // disable all
    _.each(cdn, (server, key) => {
      if (server.id == serverId)
        cdn[key].active = false
    })

    // send notification to admin
    report.sendMessage('Server *' + serverId + '* is down.\nIts automatically disabled.')
  }
}

/**
 * cronjob for downserver check
 */
new CronJob({
  cronTime: '00 */5 * * * *',
  onTick: co.wrap(function* () {

    const servers = _.uniq(cdn, server => server.id)
    const downs = _.filter(servers, server => server.active == false )

    // check down servers are back or not
    for (let id in downs) {
      const server = downs[id]
      let response

      try {
        response = yield agent
          .get(server.url + '/ping')
          .auth('savevideobot', 'sep123$%^', { auto: true })
      }
      catch(e) {}

      if (response != null) {

        // send notification to admin
        report.sendMessage('Server *' + server.id + '* is up now.\n\nhost: ' + server.url +
          '\ndowntime: ' + moment.utc(moment().diff(monitor[server.id].downfrom)).format('HH:mm:ss'))

        // enable server
        monitor[server.id].downfrom = 0
        _.each(cdn, (item, key) => {
          if (item.id == server.id) cdn[key].active = true
        })
      }
      else {
        const downtime = moment.duration(moment().diff(monitor[server.id].downfrom))

        // send notification to admin if server is down for more than 30mintues (every hour)
        if (downtime.asSeconds() >= 3600 && ~~moment().format('MM') == 0) {
          report.sendMessage('Server *' + server.id + '* is down from ' + monitor[server.id].downfrom +
            '\ndowntime duration: ' + downtime.humanize())
        }
      }
    }

    // reset downtime counters
    _.each(servers, server => {
      monitor[server.id].down = 0
    })

  }),
  start: true
})

module.exports = balancer
