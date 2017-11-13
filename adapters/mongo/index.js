const mongoose = require('mongoose')
const config = require('../../config.json')
const { dbName, username, password } = config.database.mongo

const connectionString = username.length > 0 ?
  `mongodb://${username}:${encodeURI(password)}@localhost/${dbName}` :
  `mongodb://localhost/${dbName}`

mongoose.Promise = global.Promise
mongoose.connect(connectionString, config.database.mongo.options)

const db = mongoose.connection

// check error
db.on('error', console.error.bind(console, 'Connection error: '))

db.once('open', function() {
  console.log ('savevideobot-api Mongo Connected')
})

module.exports = mongoose
