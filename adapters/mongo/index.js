const mongoose = require('mongoose')
const report = require('../../admin/report/telegram')
const config = require('../../config.json')
const { dbName, username, password } = config.database.mongo

const connectionString =
  username.length > 0
    ? `mongodb://${username}:${encodeURIComponent(
        password
      )}@127.0.0.1/${dbName}`
    : `mongodb://localhost/${dbName}`

const options = {
  ...config.database.mongo.options,
  reconnectTries: Number.MAX_VALUE,
  reconnectInterval: 1000,
  poolSize: 10,
  bufferMaxEntries: 0
}

mongoose.Promise = global.Promise
mongoose.connect(connectionString, options)

const db = mongoose.connection

// check error
db.on('error', function(e) {
  report.sendMessage(`[MongoDB] Got error: ${e}`)
})

db.on('connected', () => {
  report.sendMessage(`[MongoDB] Connected`)
})

db.on('disconnected', () => {
  report.sendMessage(`[MongoDB] DisConnected`)
})

db.once('open', function() {
  console.log('savevideobot-api Mongo Connected')
})

module.exports = mongoose
