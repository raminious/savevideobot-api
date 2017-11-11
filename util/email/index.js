const superagent = require('superagent')
const NormalizeEmail = require('normalize-email')
const detect = require('async').detect
const Cache = require('../../db/cache')
const key = 'disposable-emails-blacklist'

const Email = {}

/**
 * async search into array of domains
 */
function search(domain) {
  return new Promise(resolve => {
    getBlacklist().then(blacklist => {
      detect(blacklist, function(item, callback) {
        callback(null, domain === item)
      }, (err, result) => {
        resolve(typeof result === 'string')
      })
    })
  })
}

/**
 * get blacklist, download it if not exists in the cache
 */
async function getBlacklist() {
  let blacklist = await Cache.find(key)

  if (!blacklist) {
    const response = await superagent
      .get('https://cdn.rawgit.com/ivolo/disposable-email-domains/64884907/index.json')

    blacklist = response.body
    await Cache.save(key, blacklist, 86400)
  }

  return blacklist
}

Email.isValid = function (email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return re.test(email)
}

Email.normalize = function(email) {
  return NormalizeEmail(email.trim().toLowerCase())
}

Email.isDisposable = async function(email) {
  const domain = email
    .toLowerCase()
    .replace(/.*@/, "")

  return await search(domain)
}

module.exports = Email
