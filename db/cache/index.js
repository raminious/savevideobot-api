const client = require('../../adapters/redis')

const prefix = 'svb__api_'

const Cache = {}

Cache.find = async function(key) {
  const data = await client.getAsync(prefix + key)
  return data ? JSON.parse(data) : null
}

Cache.save = function(key, data, expire) {
  client.set(prefix+key, JSON.stringify(data))

  if (~~expire > 0) {
    client.expire(prefix + key, expire)
  }
}

module.exports = Cache