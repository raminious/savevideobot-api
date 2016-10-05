'use strict'

const co = require('co')
const moment = require('moment')
const CronJob = require('cron').CronJob
const _ = require('underscore')
const config = require('../../../config.json')

const agent = require('superagent')
require('superagent-retry')(agent)

const report = require('../../report/telegram')

// list of downloaders
const list = config.service.downloader.cdn

// kue url
const kueUrl = process.env.NODE_ENV == 'production'? '19300/kue/stats': '19300/stats'

// check kue health
const monitor = function*() {

	const message = []

	for (let i = 0; i <= list.length - 1; i++) {

		const server = list[i]
		const url = server.url.match('^http.*:')[0] + kueUrl

		try {
			const response = yield agent.get(url)
				.auth(config.auth.username, config.auth.password, { auto: true })

			const result = response.body

			if (~~result.inactiveCount > 5) {
				let data = 'Inactive count: ' + result.inactiveCount +
					'\nActive count: ' + result.activeCount +
					'\nFailed count: ' + result.failedCount

				message.push('*[ i ] Job server report for ' + server.id + '*:\n' + data + '\n\n')
			}
		}
		catch (e) {
			message.push('*[ x ] Job server ' + server.id + ' not responsed.*')
		}
	}

	if (message.length > 0)
		report.sendMessage(message.join(''))
}

/**
 * cronjob for downserver check
 */
new CronJob({
  cronTime: '* */10 * * * *',
  onTick: co.wrap(function* () {
    yield monitor()
  }),
  start: true
})