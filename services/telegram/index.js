const agent = require('superagent')
const config = require('../../config.json')

const Telegram = {}

const url = 'https://api.telegram.org/bot'

/**
* Send message to user on telegram
*/
Telegram.sendMessage = async function(chat_id, text, parse_mode, disable_web_page_preview,
  reply_markup, reply_to_message_id) {

  parse_mode = parse_mode || 'HTML'
  disable_web_page_preview = disable_web_page_preview || false

  // add footer
  text = text.trim() + '\n\nsave video bot'

  try {
    const response = await agent
      .get(url + config.telegram.token + '/sendMessage')
      .retry(1)
      .query({
        chat_id,
        text,
        parse_mode,
        disable_web_page_preview,
      })

    return true
  }
  catch(e) {
    throw e
  }
}

module.exports = Telegram
