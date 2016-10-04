'use strict'

const agent = require('superagent')
const moment = require('moment')
const group_id = '-164712622'
const url = 'https://api.telegram.org/bot118259322:AAGI0vKf2DGRtwUhrNCM4nRPkWkGJ9kWdDU'

const telegram = {}

telegram.sendMessage = function (text) {

	text = text + '\n\n' + 'Time: ' + moment().format('Y/M/D HH:MM:SS')
	agent
	  .get(url + '/sendMessage')
	  .query({
	    chat_id: group_id,
	    text,
	    parse_mode: 'Markdown',
	    disable_web_page_preview: true
	  })
	  .end((err, res) => {})
}

module.exports = telegram
