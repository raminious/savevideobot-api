const crypto = require('crypto')
const config = require('../../../config.json')

const WebMoney = {
  purse: 'Z699814753402',
  secret: '24560058-CA97-4FCB-BC08-B35EBF380E55',
  x20: '693358819'
}

WebMoney.request = function(transactionId, user, period, amount) {
  return {
    status: 'success',
    type: 'form',
    url: 'https://merchant.webmoney.ru/lmi/payment.asp',
    form: {
      LMI_PAYEE_PURSE: WebMoney.purse,
      LMI_PAYMENT_AMOUNT: amount,
      LMI_PAYMENT_NO: transactionId
    }
  }
}

WebMoney.verify = function(fields, amount) {
  const { LMI_MODE, LMI_PAYMENT_AMOUNT, LMI_PAYEE_PURSE, LMI_PAYMENT_NO, LMI_PAYER_WM,
    LMI_PAYER_PURSE, LMI_PAYER_COUNTRYID, LMI_PAYER_IP, LMI_SYS_INVS_NO, LMI_SYS_TRANS_NO,
    LMI_SYS_TRANS_DATE, LMI_HASH, LMI_HASH2, LMI_PAYMENT_DESC, LMI_LANG, LMI_DBLCHK } = fields

  const data = `${WebMoney.purse};${amount};${LMI_PAYMENT_NO};0;${LMI_SYS_INVS_NO};` +
    `${LMI_SYS_TRANS_NO};${LMI_SYS_TRANS_DATE};${WebMoney.secret};${LMI_PAYER_PURSE};` +
     `${LMI_PAYER_WM}`

  // create hash
  const hash = crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
    .toUpperCase()

  return hash === LMI_HASH2
}

module.exports = WebMoney
