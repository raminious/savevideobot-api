const Promise = require('bluebird')
const moment = require('moment')
const crypto = Promise.promisifyAll(require('crypto'))
const db = require('../../adapters/mongo')
const cache = require('../cache')

const Schema = db.Schema
const schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    index: true
  },
  token: {
    type: String,
    index: true
  },
  platform: String,
  expire_at: Date
}, {
  collection: 'access-tokens',
  timestamps: {
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
})

const AccessToken = db.model('AccessToken', schema)

// cache prefix name for user token
const cacheTokenPrefix = 'user-object-'

module.exports = {
  createAuthKey: async function() {
    const accessTokenBytes = await crypto.randomBytesAsync(24)
    return accessTokenBytes.toString('base64')
  },
  getTokenById: async function(user_id, platform) {
    return await AccessToken
      .findOne({ user_id, platform })
      .lean()
  },
  find: async function(token, platform) {
    // get user from cache
    let access = await cache.find(`${cacheTokenPrefix}${token}`)

    if (!access) {
      // get access token from db
      access = await AccessToken
        .findOne({ token, platform })
        .lean()

      // check access token if expired, if yes remove expired token from db
      if (access && moment().isAfter(moment(access.expire_at))) {
        await this.remove(access.token)
        return null
      }

      if (access) {
        // save token in cache
        cache.save(`${cacheTokenPrefix}${access.token}`, access, 3600)
      }
    }

    return access
  },
  getCounts: async function(user_id, platform) {
    return await AccessToken
      .count({ user_id, platform })
      .lean()
  },
  create: async function(user_id, platform, expireDays = 30) {
    const accessToken = new AccessToken({
      token: await this.createAuthKey(),
      expire_at: moment().add(expireDays, 'days').format(),
      user_id,
      platform
    })

    return await accessToken.save()
  },
  remove: async function(token) {
    return await AccessToken.remove({ token })
  }
}
