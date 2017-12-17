const Koa = require('koa')
const router = require('koa-router')()
const Payment = require('../../../db/payment')
const app = new Koa()

router.get('/payment/status/:id', async function (ctx, next) {
  const _id = ctx.params.id
  ctx.assert(_id, 400, 'Id is required')
  ctx.assert(/^[0-9a-fA-F]{24}$/.test(_id), 400, 'Invalid payment id')

  const payment = await Payment.findOne({ _id })

  ctx.body = {
    status: payment.status,
    transactionNumber: payment.transactionNumber,
    message: payment.message,
    updated_at: payment.updatedAt
  }
})

module.exports = app.use(router.routes())
