const mongoose = require('mongoose')
const config = require('../../config.json')
const { dbName, username, password } = config.database.mongo

const connectionString =
  username.length > 0
    ? `mongodb://${username}:${encodeURI(password)}@127.0.0.1/${dbName}`
    : `mongodb://localhost/${dbName}`

const options = {
  ...config.database.mongo.options,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000
}

mongoose.Promise = global.Promise
mongoose.connect(connectionString, options)

const db = mongoose.connection

// check error
db.on('error', console.error.bind(console, 'Connection error: '))

db.once('open', function() {
  console.log('savevideobot-api Mongo Connected')
})

module.exports = mongoose
