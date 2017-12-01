const fs = require('fs')
const _ = require('underscore')
const config = require('../../config.json')

const mailgun = require('mailgun-js')({
  apiKey: config.mailgun.key,
  domain: config.mailgun.domain
})

const templates = {
  'email-verify': fs.readFileSync(__dirname + '/templates/email-verify.html', 'utf8'),
  'password-reset': fs.readFileSync(__dirname + '/templates/password-reset.html', 'utf8')
}

module.exports = function(recipient, data) {
  const mailData = {
    from: 'SaveVideoBot <no-reply@savevideobot.com>',
    to: recipient,
    subject: data.subject,
    html: getHtml(data)
  }

  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[ Send Mail Fake ] ', data)
      return resolve(true)
    }

    mailgun.messages().send(mailData, (err, body) => {
      if (err) {
        console.log('[ Send Mail Error ] ', err)
        return resolve(null)
      }
      return resolve(true)
    })
  })
}

const getHtml = function(data) {
  const compiled = _.template(templates[data.layout])
  return compiled(data)
}
