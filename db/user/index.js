const Promise = require('bluebird')
const moment = require('moment')
const bcrypt = Promise.promisifyAll(require('bcrypt'))
const crypto = Promise.promisifyAll(require('crypto'))
const db = require('../../adapters/mongo')
const cache = require('../cache')
const Email = require('../../util/email')

const Schema = db.Schema
const schema = new Schema({
  email: String,
  email_confirmed: Boolean,
  telegram_id: String,
  name: String,
  password: String,
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

module.exports = {
  findById: async function(userId){
    return await User
      .findOne({ _id: userId.toString() })
      .lean()
  },
  find: async function(criteria) {
    return await User
      .findOne(criteria)
      .lean()
  },
  getObject: function(user, tokenParams = {}) {
    return {
      id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      email_confirmed: user.email_confirmed || false,
      telegram_bot: user.telegram_bot,
      telegram_id: user.telegram_id,
      localization: user.localization,
      ...tokenParams
    }
  },
  create: async function(identity) {
    const user = new User({
      telegram_id: identity.telegram_id,
      name: identity.name.trim(),
      email: identity.email,
      username: identity.username,
      password: identity.password ? await this.hashPassword(identity.password) : undefined,
      role: identity.role,
      createdAt: moment().format()
    })

    return await user.save()
  },
  update: async function(userId, attrs){
    return await User.findOneAndUpdate({_id: userId}, attrs)
  },
  remove: async function(_id) {
    return await User.remove({ _id })
  },
  login: async function(email, password) {
    const normalizedEmail = Email.normalize(email)
    const user = await User
      .findOne({ email: normalizedEmail })
      .lean()

    return await this.passwordValidation(password, user.password) ? user : null
  },
  hashPassword: async function(password) {
    const salt = await bcrypt.genSaltAsync(10)
    return bcrypt.hashAsync(password, salt)
  },
  passwordValidation: async function(password, hash) {
   return await bcrypt.compareAsync(password, hash)
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
  },
  createEmailVerificationPin: function(user, code) {
    const resetObject = {
      id: user._id,
      code: code,
      time: moment().format('X')
    }
    cache.save(`verify-email-${user._id}`, resetObject, 7200)
  },
  getEmailVerificationPin: async function(user) {
    return await cache.find(`verify-email-${user._id}`)
  },
  removeEmailVerificationPin: async function(user) {
    return await cache.remove(`verify-email-${user._id}`)
  }
}
