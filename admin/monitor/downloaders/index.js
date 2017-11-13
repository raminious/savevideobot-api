const agent = require('superagent')
const moment = require('moment')
const CronJob = require('cron').CronJob
const _ = require('underscore')
const config = require('../../../config.json')
const report = require('../../report/telegram')

// list of downloaders
const list = config.service.downloader.cdn

// check kue health
const monitor = async function() {
	if (process.env.NODE_ENV !== 'production') {
		return false
	}

	const message = []

	for (let i = 0; i <= list.length - 1; i++) {

		const server = list[i]
		const url = server.url + '/stats'

		try {
			const response = await agent.get(url)
				.auth(config.auth.username, config.auth.password)

			const result = response.body
			const stats = result.stats
			const system = result.system

			if (~~stats.active > 3 || ~~stats.delayed > 0) {
				let data = 'Inactive count: ' + stats.delayed +
					'\nActive count: ' + stats.active +
					'\nFailed count: ' + stats.failed +
					'\n\nMemory: ' + system.used + '/' + system.total

				message.push('*[ i ] Job report for ' + server.id + '*:\n' + data + '\n\n')
			}
		}
		catch (e) {
			message.push('*[ x ] Job server ' + server.id + ' did not response.*\n' + e.message + '\n\n')
		}
	}

	if (message.length > 0) {
		report.sendMessage(message.join(''))
	}
}

/**
 * cronjob for downserver check
 */
new CronJob({
  cronTime: '00 */10 * * * *',
  onTick: async function () {
    await monitor()
  },
  start: process.env.pm_id ? (process.env.pm_id == 0 ? true: false) : true
})
