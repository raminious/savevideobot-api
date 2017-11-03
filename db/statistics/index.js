const db = require('../../adapters/mongo')
const Schema = db.Schema

const schema = new Schema({
  explore: Number
}, {
  timestamps: { created_at: 'created_at' }
})

const Statistics = db.model('statistic', schema)

module.exports = {

  updateCounter: function (metric) {
    return new Promise((resolve, reject) => {
      return Statistics.findOneAndUpdate({}, { $inc: { [metric]: 1 } }, { upsert: true })
      .then(resolve, reject)
    })
  }
}
