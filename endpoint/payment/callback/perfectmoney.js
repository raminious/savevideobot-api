const Koa = require('koa')
const router = require('koa-router')()
const bodyParser = require('koa-bodyparser')
const crypto = require('crypto')
const User = require('../../../db/user')
const Payment = require('../../../db/payment')
const PerfectMoney = require('../../../db/payment/gates/perfectmoney')
const config = require('../../../config.json')
const app = new Koa()

function md5(string) {
  return crypto.createHash('md5').update(string).digest('hex')
}

router.post('/payment/callback/perfectmoney', bodyParser(), async function (ctx, next) {
  const { PAYEE_ACCOUNT, PAYMENT_AMOUNT, PAYMENT_UNITS, PAYMENT_BATCH_NUM,
    PAYMENT_ID, SUGGESTED_MEMO, V2_HASH, TIMESTAMPGMT, PAYER_ACCOUNT} = ctx.request.body

  const payment = await Payment.findOne({
    gate: 'perfectmoney',
    transactionNumber: PAYMENT_ID,
    status: 'Pending'
  })

  ctx.assert(payment, 404, 'Transaction Not Found Or Expired')

  // redirect url
  const redirect = `${config.domain}/dashboard/payment/status/${payment._id}`

  // create hash string
  const data = (`${PAYMENT_ID}:${PAYEE_ACCOUNT}:${PAYMENT_AMOUNT}:${PAYMENT_UNITS}:${PAYMENT_BATCH_NUM}` +
    `:${PAYER_ACCOUNT}:${PerfectMoney.PASSPHRASE}:${TIMESTAMPGMT}`)

  // create hash
  const generatedHash = md5(data).toUpperCase()

  if (generatedHash === V2_HASH &&
    PAYEE_ACCOUNT === PerfectMoney.account &&
    PAYMENT_UNITS === 'USD' &&
    PAYMENT_AMOUNT === payment.amount.toString()
  ) {
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
