const User = require('../../../../db/user')
const AccessToken = require('../../../../db/access-token')

module.exports = async function() {
  const { email, password, terminateOtherSessions } = this.request.body
  const platform = this.headers['app-platform']
  const { t } = this

  const tokenLimits = {
    web: 1,
    mobile: 2
  }

  this.assert(['web', 'mobile'].indexOf(platform) > -1,
    400, 'Invalid device type')

  this.assert(email != null, 400, t('Email is required'))
  this.assert(password != null, 400, t('Password is required'))

  const user = await User.login(email, password)
  this.assert(user != null, 404, t('Invalid email or password'))

  // get user id
  const user_id = user._id.toString()

  if (terminateOtherSessions === true) {
    AccessToken.terminateSessions({ user_id, platform })
  } else {
    const sessions = await AccessToken.getSessions({ user_id, platform })
    this.assert(sessions.length < tokenLimits[platform], 403,
      t('You have logged in with another devices'))
  }

  // create new access token
  const newAccess = await AccessToken.create(user_id, platform)

  return User.getObject(user, {
    access_token: newAccess.token,
    access_token_expire: newAccess.expire_at,
    access_token_platform: newAccess.platform
  })
}
