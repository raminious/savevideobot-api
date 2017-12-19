const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const WebMoney = require('../../../db/payment/gates/webmoney')
const config = require('../../../config.json')
const app = new Koa()

/**
 * handle payment result sends by webmoney
 */
router.post('/payment/callback/webmoney/result', bodyParser(), async function (ctx, next) {
  const fields = ctx.request.body
  const { LMI_PAYMENT_NO, LMI_PAYER_PURSE } = fields

  // check payment number is provided
  ctx.assert(LMI_PAYMENT_NO != null, 400, 'Payment number is required')

  const payment = await Payment.findOne({
    gate: 'webmoney',
    transactionNumber: LMI_PAYMENT_NO,
    status: 'Pending'
  })

  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  if (WebMoney.verify(fields, payment.amount)) {
    await Payment.update(payment._id, {
      payerAccount: LMI_PAYER_PURSE,
      status: 'Success'
    })
    await Payment.updateSubscription(payment.user_id, payment.period)
  } else {
    await Payment.update(payment._id, { status: 'Failed' })
  }

  ctx.body = {}
})

/**
 * handle success url
 */
router.post('/payment/callback/webmoney/success', bodyParser(), async function (ctx, next) {
  const { LMI_PAYMENT_NO } = ctx.request.body

  const payment = await Payment.findOne({
    gate: 'webmoney',
    transactionNumber: LMI_PAYMENT_NO
  })
  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`
  ctx.redirect(redirect)
})

/**
 * handle fail url
 */
router.post('/payment/callback/webmoney/fail', bodyParser(), async function (ctx, next) {
  const { LMI_PAYMENT_NO } = ctx.request.body

  const payment = await Payment.findOne({
    gate: 'webmoney',
    transactionNumber: LMI_PAYMENT_NO,
    status: 'Pending'
  })
  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`
  await Payment.update(payment._id, { status: 'Failed' })

  ctx.redirect(redirect)
})

module.exports = app.use(router.routes())
