const moment = require('moment')
const User = require('../../../../db/user')
const AccessToken = require('../../../../db/access-token')

async function createTelegramAccessToken(user_id) {
  return await AccessToken.create(user_id, 'telegram', 200 * 12 * 30)
}

module.exports = async function () {
  const { t } = this
  const { id, name } = this.request.body

  this.assert(id != null, 400, t('Telegram id is required'))
  this.assert(/^[0-9]+$/.test(id), 400, t('Invalid telegram id'))

  this.assert(name != null, 400, t('Name is required'))

  // check user is registered before
  let user = await User.find({ telegram_id: id })

  if (user) {
    let access = await AccessToken.getTokenById(user._id, 'telegram')

    if (!access) {
      access = await createTelegramAccessToken(user._id)
    }

    return User.getObject(user, {
      access_token: access.token
    })
  }

  //signup user if not registered
  user = await User.create({
    telegram_id: id,
    name: name,
    subscription: moment().add(12, 'days').format()
  })

  // create new access token
  const newAccess = await createTelegramAccessToken(user._id)

  return User.getObject(user, {
    access_token: newAccess.token
  })
}
