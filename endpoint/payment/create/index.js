const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const config = require('../../../config.json')
const app = new Koa()

const payments = {
  perfectmoney: require('../../../db/payment/gates/perfectmoney'),
  payir: require('../../../db/payment/gates/payir'),
  bitcoin: require('../../../db/payment/gates/bitcoin'),
  zarinpal: require('../../../db/payment/gates/zarinpal'),
  webmoney: require('../../../db/payment/gates/webmoney')
}

router.post('/payment/create', bodyParser(), async function (ctx, next) {
  ctx.assert(ctx.is('json'), 415, 'Content type should be json')
  const isProduction = process.env.NODE_ENV === 'production'
  const { gate, period } = ctx.request.body
  const { t } = ctx

  ctx.assert(['bitcoin', 'perfectmoney', 'webmoney', 'payir', 'zarinpal'].indexOf(gate) > -1,
    400, t('Invalid Gateway'))
  ctx.assert([3, 6, 12].indexOf(~~period) > -1, 400, t('Invalid Period'))

  // get user object
  const user = await User.findById(ctx.identity.user_id)

  // get payment amount in USD
  const amount = isProduction ? config.pricing.month[period].current : 0.1

  // create a uniq transaction number
  const transactionId = Payment.createTransactionNumber(gate)

  // send payment request to gateway
  const result = await payments[gate].request(transactionId, user, period, amount)

  if (result.status !== 'success') {
    ctx.status = 400
    ctx.body = result.errorMessage
    return false
  }

  // create payment row
  await Payment.create(ctx.identity.user_id, transactionId, result.authCode, period, gate, amount)

  ctx.body = {
    type: result.type,
    form: result.form,
    url: result.url
  }
})

module.exports = app.use(router.routes())
