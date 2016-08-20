'use strict'

const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');
const User = require('svb-core/lib/user');

const authentications = {
  'credential': require('./methods/credential'),
  'telegram': require('./methods/telegram')
}

router.post('/user/access-token', bodyParser(), function* (next) {

  this.assert(this.is('json'), 415, 'content type should be json');

  const method = this.request.body.method || 'credential';
  this.assert(Object.keys(authentications).indexOf(method) !== -1, 400, 'invalid authentication method');

  // get user access-token based on authentication method
  const user = yield authentications[method].bind(this);

  this.body = {
    token: user.access_token
  }
});

module.exports = require('koa')().use(router.routes());
