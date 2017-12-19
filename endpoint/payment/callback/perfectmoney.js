const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const PerfectMoney = require('../../../db/payment/gates/perfectmoney')
const config = require('../../../config.json')
const app = new Koa()

router.post('/payment/callback/perfectmoney', bodyParser(), async function (ctx, next) {
  const fields = ctx.request.body
  const { PAYMENT_ID, PAYER_ACCOUNT } = fields

  const payment = await Payment.findOne({
    gate: 'perfectmoney',
    transactionNumber: PAYMENT_ID,
    status: 'Pending'
  })

  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  // redirect url
  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`

  if (PerfectMoney.verify(fields, payment.amount)) {
    await Payment.update(payment._id, {
      payerAccount: PAYER_ACCOUNT,
      status: 'Success'
    })
    await Payment.updateSubscription(payment.user_id, payment.period)
  } else {
    await Payment.update(payment._id, { status: 'Failed' })
  }

  ctx.redirect(redirect)
})

module.exports = app.use(router.routes())
