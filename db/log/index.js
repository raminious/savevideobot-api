const db = require('../../adapters/mongo')
const Statistics = require('../statistics')
const Schema = db.Schema

const schema = new Schema({
  user_id: Schema.Types.ObjectId,
  type: String,
  text: String
}, {
  timestamps: { created_at: 'created_at' }
})

const Log = db.model('log', schema)

module.exports = {

  create: function(user_id, type, text) {
    const log = new Log({ type, user_id, text })
    return new Promise((resolve, reject) => {
      return log.save()
      .then(Statistics.updateCounter(type), reject)
      .then(resolve, reject)
    })
  }
}
