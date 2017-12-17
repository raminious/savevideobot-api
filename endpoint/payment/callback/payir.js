const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const PayIr = require('../../../db/payment/gates/payir')
const config = require('../../../config.json')
const app = new Koa()

router.post('/payment/callback/payir', bodyParser(), async function (ctx, next) {
  const { status, transId, factorNumber, description, message } = ctx.request.body

  const payment = await Payment.findOne({
    authCode: transId,
    transactionNumber: factorNumber,
    status: 'Pending'
  })

  // check transaction
  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  // callback urls
  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`

  if (~~status !== 1) {
    await Payment.update(payment._id, {
      status: 'Failed',
      message
    })

    return ctx.redirect(redirect)
  }

  const amount = payment.amount * config.pricing.rates.USDIRT * 10
  const result = await PayIr.verify(transId)

  if (result && ~~result.status === 1 && ~~result.amount === ~~amount) {
    await Payment.update(payment._id, { status: 'Success' })
    await Payment.updateSubscription(payment.user_id, payment.period)
  } else {
    await Payment.update(payment._id, { status: 'Failed' })
  }

  ctx.redirect(redirect)
})

module.exports = app.use(router.routes())
