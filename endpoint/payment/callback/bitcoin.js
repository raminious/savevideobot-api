const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const Bitcoin = require('../../../db/payment/gates/bitcoin')
const config = require('../../../config.json')
const app = new Koa()

/**
 * handle payment status
 */
router.post('/payment/callback/bitcoin/status', bodyParser(), async function (ctx, next) {
  const fields = ctx.request.body
  const { order_id, status } = fields
  const { token } = ctx.query

  ctx.assert(order_id != null, 400, 'Order number is required')
  ctx.assert(token != null, 400, 'Token is required')

  const payment = await Payment.findOne({
    gate: 'bitcoin',
    transactionNumber: order_id,
    status: 'Pending'
  })

  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  // create token
  ctx.assert(token === `${payment.user_id}${order_id}`, 400, 'Invalid token')

  if (status === 'paid') {
    if (Bitcoin.verify(fields, payment.amount)) {
      await Payment.update(payment._id, { status: 'Success' })
      await Payment.updateSubscription(payment.user_id, payment.period)
    } else {
      await Payment.update(payment._id, { status: 'Failed' })
    }
  } else {
    Payment.update(payment._id, { status })
  }

  ctx.body = {}
})

/**
 * handle callback
 */
router.get('/payment/callback/bitcoin', bodyParser(), async function (ctx, next) {
  const { status, invoice } = ctx.query

  ctx.assert(status != null, 400, 'Status is required')
  ctx.assert(invoice != null, 400, 'Invoice is required')

  const payment = await Payment.findOne({
    gate: 'bitcoin',
    transactionNumber: invoice
  })

  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  if (status === 'cancel' && payment.status !== 'Success') {
    await Payment.update(payment._id, { status: 'Canceled' })
  }

  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`
  ctx.redirect(redirect)
})


module.exports = app.use(router.routes())
