const crypto = require('crypto')
const config = require('../../../config.json')

const PerfectMoney = {
  account: 'U11459326',
  PASSPHRASE: 'C1787A35E61C10E7C8B4FF93904A2EA9'
}

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const environment = {
  development: {
    callback: `http://localhost:17000`
  },
  production: {
    callback: `${config.domain}/api`
  }
}

PerfectMoney.request = function(transactionId, user, period, amount) {
  const callback = `${environment[env].callback}/payment/callback/perfectmoney`

  return {
    status: 'success',
    type: 'form',
    url: 'https://perfectmoney.is/api/step1.asp',
    form: {
      PAYEE_ACCOUNT: PerfectMoney.account,
      PAYEE_NAME: 'SaveVideoBot',
      PAYMENT_AMOUNT: amount,
      PAYMENT_UNITS: 'USD',
      PAYMENT_ID: transactionId,
      STATUS_URL: `${callback}?status=STS`,
      PAYMENT_URL: `${callback}?status=OK`,
      PAYMENT_URL_METHOD: 'POST',
      NOPAYMENT_URL: `${callback}?status=NOK`,
      NOPAYMENT_URL_METHOD: 'POST',
      AVAILABLE_PAYMENT_METHODS: 'account, voucher, sms, wire',
      INTERFACE_LANGUAGE: user.localization || 'en_US'
    }
  }
}

PerfectMoney.verify = function(fields, amount) {
  const { PAYEE_ACCOUNT, PAYMENT_AMOUNT, PAYMENT_UNITS, PAYMENT_BATCH_NUM,
    PAYMENT_ID, SUGGESTED_MEMO, V2_HASH, TIMESTAMPGMT, PAYER_ACCOUNT} = fields

  // create hash string
  const data = (`${PAYMENT_ID}:${PAYEE_ACCOUNT}:${PAYMENT_AMOUNT}:${PAYMENT_UNITS}:${PAYMENT_BATCH_NUM}` +
    `:${PAYER_ACCOUNT}:${PerfectMoney.PASSPHRASE}:${TIMESTAMPGMT}`)

  // create hash
  const generatedHash = crypto
    .createHash('md5')
    .update(data)
    .digest('hex')
    .toUpperCase()

  return generatedHash === V2_HASH &&
    PAYEE_ACCOUNT === PerfectMoney.account &&
    PAYMENT_UNITS === 'USD' &&
    PAYMENT_AMOUNT === amount.toString()
}

module.exports = PerfectMoney
