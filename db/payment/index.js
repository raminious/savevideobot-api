const Promise = require('bluebird')
const moment = require('moment')
const db = require('../../adapters/mongo')
const User = require('../user')

const Schema = db.Schema
const schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    index: true
  },
  transactionNumber: String,
  authCode: String,
  referenceCode: String,
  period: String,
  gate: String,
  amount: Number,
  status: String,
  message: String,
  payerAccount: String,
  expire_at: Date
}, {
  timestamps: {
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
})

const Payment = db.model('Payment', schema)

module.exports = {
  findOne: async function(criteria) {
    return await Payment
      .findOne(criteria)
      .lean()
  },
  createTransactionNumber: function() {
    const ts = Math.floor(Date.now() / 1000)
    const rnd = Math.floor(Math.random() * (999 - 100) + 100)
    return `${ts}${rnd}`
  },
  update: async function(paymentId, attrs){
    return await Payment.findOneAndUpdate({ _id: paymentId }, attrs)
  },
  updateSubscription: async function(user_id, period) {
    const user = await User.findById(user_id)
    const subscription = User.increaseSubscription(user, ~~period * 31)
    await User.update(user._id, { subscription })
  },
  create: async function(user_id, transactionNumber, authCode, period, gate, amount) {
    const payment = new Payment({
      user_id,
      gate,
      amount,
      period,
      transactionNumber,
      authCode,
      status: 'Pending',
      expire_at: moment().add(15, 'minutes').format()
    })

    return await payment.save()
  }
}
