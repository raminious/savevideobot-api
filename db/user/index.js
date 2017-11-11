const Promise = require('bluebird')
const moment = require('moment')
const bcrypt = Promise.promisifyAll(require('bcrypt'))
const crypto = Promise.promisifyAll(require('crypto'))
const db = require('../../adapters/mongo')
const cache = require('../cache')
const Schema = db.Schema
const schema = new Schema({
  email: String,
  telegram_id: String,
  name: String,
  username: String,
  password: String,
  access_token: String,
  localization: String,
  role: String,
  telegram_bot: {
    token: String,
    name: String,
    username: String
  }
}, {
  timestamps: { created_at: 'created_at', updated_at: 'updated_at'}
})

const User = db.model('User', schema)

const cacheTokenPrefix = 'user_tkn_'

module.exports = {
  findById: async function(userId){
    return await User
      .findOne({ _id: userId.toString() })
      .lean()
  },
  findByToken: async function(token) {
    // get user from cache
    let user = await cache.find(`${cacheTokenPrefix}${token}`)

    if (user == null) {
      user = await User
        .findOne({ access_token: token })
        .lean()

      if (user) {
        cache.save(`${cacheTokenPrefix}${user.access_token}`, user, 3600)
      }
    }

    return user
  },
  find: async function(criteria) {
    return await User
      .findOne(criteria)
      .lean()
  },
  getObject: function(user) {
    return {
      id: user._id,
      name: user.name,
      access_token: user.access_token,
      username: user.username,
      email: user.email,
      telegram_bot: user.telegram_bot,
      telegram_id: user.telegram_id,
      localization: user.localization
    }
  },
  create: async function(identity) {
    const user = new User({
      telegram_id: identity.telegram_id,
      name: identity.name.trim(),
      email: identity.email,
      username: identity.username,
      password: identity.password ? await this.hashPassword(identity.password) : undefined,
      access_token: await this.createAuthKey(),
      role: identity.role,
      createdAt: identity.time || moment().format()
    })

    return await user.save()
  },
  update: async function(userId, attrs){
    const user = await User.findOneAndUpdate({_id: userId}, attrs)

    // remove cache
    cache.remove(`${cacheTokenPrefix}${user.access_token}`)

    return user
  },
  remove: async function(_id) {
    return await User.remove({ _id })
  },
  login: async function(email, password) {

    const user = await User.findOne({email: email.trim().toLowerCase()})

    if (user == null) {
      return null
    }

    return (await this.passwordValidation(password, user.password)) ? user : null
  },
  hashPassword: async function(password) {
    const salt = await bcrypt.genSaltAsync(10)
    return bcrypt.hashAsync(password, salt)
  },
  passwordValidation: async function(password, hash) {
   return await bcrypt.compareAsync(password, hash)
  },
  createAuthKey: async function() {
    const accessTokenBytes = await crypto.randomBytesAsync(24)
    return accessTokenBytes.toString('base64')
  },
  isAdmin: function (user) {
    return ['admin', 'superadmin'].indexOf(user.role) != -1
  },
  getRandomNumber: function() {
    const min = 100000
    const max = 999999
    return Math.floor(Math.random() * (max - min + 1)) + min
  },
  createResetPasswordPin: function(user, resetCode) {
    const resetObject = {
      id: user._id,
      code: resetCode,
      time: moment().format('X')
    }
    cache.save(`reset-password-${user._id}`, resetObject, 7200)
  },
  getResetPasswordPin: async function(user) {
    return await cache.find(`reset-password-${user._id}`)
  },
  removeResetPasswordPin: async function(user) {
    return await cache.remove(`reset-password-${user._id}`)
  }
}
