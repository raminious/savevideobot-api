const User = require('../../../../db/user')

module.exports = async function() {
  const email = this.request.body.email
  const password = this.request.body.password

  this.assert(email != null, 400, 'email is required')
  this.assert(password != null, 400, 'password is required')

  const user = await User.login(email, password)
  this.assert(user != null, 404, 'invalid username or password')

  return user
}
