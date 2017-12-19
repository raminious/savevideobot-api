const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const Zarinpal = require('../../../db/payment/gates/zarinpal')
const config = require('../../../config.json')
const app = new Koa()

router.get('/payment/callback/zarinpal', bodyParser(), async function (ctx, next) {
  const { Authority, Status } = ctx.query

  const payment = await Payment.findOne({
    gate: 'zarinpal',
    authCode: Authority,
    status: 'Pending'
  })

  // check transaction
  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  // callback urls
  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`

  if (Status !== 'OK') {
    await Payment.update(payment._id, { status: 'Failed' })
    return ctx.redirect(redirect)
  }

  const amount = payment.amount * config.pricing.rates.USDIRT
  const referenceCode = await Zarinpal.verify(Authority, amount)

  if (referenceCode !== false) {
    await Payment.update(payment._id, { status: 'Success', referenceCode })
    await Payment.updateSubscription(payment.user_id, payment.period)
  } else {
    await Payment.update(payment._id, { status: 'Failed' })
  }

  ctx.redirect(redirect)
})

module.exports = app.use(router.routes())
