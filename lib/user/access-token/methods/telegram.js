const User = require('svb-core/lib/user')

module.exports = function* () {

  const id = this.request.body.id
  const username = this.request.body.username
  const name = this.request.body.name

  this.assert(id != null, 400, 'telegram id is required')
  this.assert(/^[0-9]+$/.test(id), 400, 'invalid telegram id')

  this.assert(name != null, 400, 'name is required')
  this.assert(username != null, 400, 'username is required')

  // check user is registered before
  const user = yield User.find({ telegram_id: id })

  if (user != null)
    return user

  //signup user if not registered
  return yield User.create({
    telegram_id: id,
    name: name,
    username: username,
    time: this.request.body.time
  })
}
