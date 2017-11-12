const User = require('../../../../db/user')
const AccessToken = require('../../../../db/access-token')

async function createTelegramAccessToken(user_id) {
  return await AccessToken.create(user_id, 'telegram', 200 * 12 * 30)
}

module.exports = async function () {
  const id = this.request.body.id
  const username = this.request.body.username
  const name = this.request.body.name

  this.assert(id != null, 400, 'telegram id is required')
  this.assert(/^[0-9]+$/.test(id), 400, 'invalid telegram id')

  this.assert(name != null, 400, 'name is required')
  this.assert(username != null, 400, 'username is required')

  // check user is registered before
  let user = await User.find({ telegram_id: id })

  if (user) {
    let access = await AccessToken.getTokenById(user._id, 'telegram')

    if (!access) {
      access = await createTelegramAccessToken(user._id)
    }

    return User.getObject(user, { access_token: access.token })
  }

  //signup user if not registered
  user = await User.create({
    telegram_id: id,
    name: name
  })

  // create new access token
  const newAccess = await createTelegramAccessToken(user._id)

  return User.getObject(user, { access_token: newAccess.token })
}
