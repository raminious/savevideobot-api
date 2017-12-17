const agent = require('superagent')
const config = require('../../../config.json')

const PayIr = {}

const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'
const environment = {
  development: {
    api: 'test',
    redirect: `http://localhost:17000`
  },
  production: {
    api: '23003814681b71ae960baaa9a57d54ac',
    redirect: `${config.domain}/api`
  }
}

PayIr.request = async function(transactionId, user, period, amount) {
  const amountInRials = amount * config.pricing.rates.USDIRT * 10

  try {
    const response = await agent
      .post('https://pay.ir/payment/send')
      .send({
        api: environment[env].api,
        factorNumber: transactionId,
        redirect: `${environment[env].redirect}/payment/callback/payir`,
        amount: amountInRials
      })

    const { transId } = response.body
    return {
      status: 'success',
      authCode: transId,
      url: `https://pay.ir/payment/gateway/${transId}`
    }

  } catch(e) {
    return {
      status: 'error',
      errorStatus: e.response.body.errorCode,
      errorMessage: e.response.body.errorMessage
    }
  }
}

PayIr.verify = async function(transactionId) {
  try {
    const response = await agent
      .post('https://pay.ir/payment/verify')
      .send({
        api: environment[env].api,
        transId: transactionId
      })

    return response.body

  } catch(e) {
    return null
  }
}

module.exports = PayIr
