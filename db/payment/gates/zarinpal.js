const Gateway = require('zarinpal-checkout')
const config = require('../../../config.json')

const ZarinPal = {}

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const environment = {
  development: {
    callback: `http://localhost:17000`
  },
  production: {
    callback: `${config.domain}/api`
  }
}

// create gateway instance
const payment = Gateway.create('8926607a-04bb-11e6-ae78-005056a205be', env !== 'production')

ZarinPal.request = function(transactionId, user, period, amount) {
  const amountInTomans = amount * config.pricing.rates.USDIRT // In Tomans

  return new Promise((resolve, reject) => {
    payment.PaymentRequest({
      Amount: amountInTomans,
      CallbackURL: `${environment[env].callback}/payment/callback/zarinpal`,
      Description: `${period}month subscription`,
      Email: user.email,
      Mobile: ''
    }).then(response => {
      if (~~response.status === 100) {
        resolve({
          status: 'success',
          authCode: response.authority,
          url: response.url
        })
      } else {
        resolve({
          status: 'error',
          errorStatus: response.status,
          errorMessage: 'Can not create transaction, Try Again.'
        })
      }
    }).catch(err => {
      return resolver({
        status: 'error',
        errorStatus: -1,
        errorMessage: err
      })
    })
  })
}

ZarinPal.verify = async function(authCode, amount) {
  return new Promise((resolve, reject) => {
    payment.PaymentVerification({
      Amount: amount, // In Tomans
      Authority: authCode,
    }).then(response => {
      return (response.status === -21) ? resolve(false) : resolve(response.RefID)
    }).catch(err => {
      return resolve(false)
    })
  })
}

module.exports = ZarinPal
