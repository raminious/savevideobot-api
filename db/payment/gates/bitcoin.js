const agent = require('superagent')
const crypto = require('crypto')
const config = require('../../../config.json')

const Bitcoin = {
  url: 'https://api.coingate.com/v1',
  appId: '6049',
  key: 'T0ACx7DdFtc6qjMenUNrSQ',
  secret: 'KnQW26qY8bkAo3PGiTJj1F5SC09RrXsp'

  // url: 'https://api-sandbox.coingate.com/v1',
  // appId: '988',
  // key: 'lTERn2wpY7PBhNA6HQLyxW',
  // secret: 'h2Pv0WEMgczNbpAntaoZQBe8KDU6Oidw'
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

Bitcoin.getSignature = function(nonce) {
  const string = `${nonce}${Bitcoin.appId}${Bitcoin.key}`

  return crypto
    .createHmac('SHA256', Bitcoin.secret)
    .update(string)
    .digest('hex')
}

Bitcoin.request = async function(transactionId, user, period, amount) {
  const signature = Bitcoin.getSignature(transactionId)
  const callback = `${environment[env].callback}/payment/callback/bitcoin`
  const token = `${user._id}${transactionId}`

  try {
    const response = await agent
      .post(`${Bitcoin.url}/orders`)
      .set({
        'User-Agent': 'Nodejs',
        'Access-Nonce': transactionId,
        'Access-Key': Bitcoin.key,
        'Access-Signature': signature
      })
      .send({
        order_id: transactionId,
        price: amount,
        currency: 'USD',
        receive_currency: 'BTC',
        title: `SaveVideoBot - ${period}month subscription`,
        callback_url: `${callback}/status?token=${token}`,
        cancel_url: `${callback}?status=cancel&invoice=${transactionId}`,
        success_url: `${callback}?status=success&invoice=${transactionId}`
      })

    const transaction = response.body

    return {
      status: 'success',
      authCode: transaction.bitcoin_uri,
      url: transaction.payment_url
    }

  } catch (e) {
    return {
      status: 'error',
      errorMessage: 'Could not create a new transaction, try again.'
    }
  }
}

Bitcoin.verify = async function(fields, amount) {
  const { currency, price, order_id, status, btc_amount, receive_amount } = fields

  return currency === 'USD' &&
    price === amount.toString() &&
    receive_currency === 'BTC' &&
    receive_amount >= (btc_amount * 0.98) // 2% fee
}

module.exports = Bitcoin
