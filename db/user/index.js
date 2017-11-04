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
  request_token: String,
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

  getIdentity: async function(identity){
    return (await this.findById(identity.id)) || (await this.create(identity))
  },
  findById: async function(userId){
    return await User.findOne({id: userId.toString()})
  },
  findByToken: async function(token) {
    // get user from cache
    let user = await cache.find('user_tkn_' + token)

    if (user == null) {
      user = await User.findOne({access_token: token})

      if (user) {
        cache.save('user_tkn_' + user.access_token, user, 3600)
      }
    }

    return user
  },
  find: async function(criteria) {
    return await User.findOne(criteria)
  },
  create: async function(identity) {
    const u = new User({
      telegram_id: identity.telegram_id,
      name: identity.name.trim(),
      email: identity.email,
      username: identity.username,
      password: identity.password? await this.hashPassword(identity.password): undefined,
      access_token: await this.createAuthKey(),
      role: identity.role,
      createdAt: identity.time || moment().format()
    })
    return await u.save()
  },
  update: async function(userId, attrs){
    return await User.findOneAndUpdate({_id: userId}, attrs)
  },
  login: async function(email, password) {

    const user = await User.findOne({email: email.trim().toLowerCase()})

    if (user == null)
      return null

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
  }
}
