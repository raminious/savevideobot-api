'use strict'

const responseTime = require('koa-response-time');
const ratelimit = require('koa-ratelimit');
const compress = require('koa-compress');
const mount = require('koa-mount');
const koa = require('koa');
const redis = require('redis');
const _ = require('underscore');
const routes = require('./routes');

module.exports = function api() {

  let app = koa();

  // trust proxy
  app.proxy = true;

  // x-response-time
  app.use(responseTime());

  // handle application errors
  app.use(function *(next) {
    try {
      yield next;
    } catch (e) {
      this.throw(e.response.text, e.response.status)
    }
  });

  // request rate limit
  app.use(ratelimit({
    db: redis.createClient(),
    duration: 36000,
    max: 100,
    id: context => context.ip,
    headers: {
      remaining: 'Rate-Limit-Remaining',
      reset: 'Rate-Limit-Reset',
      total: 'Rate-Limit-Total'
    }
  }));

  //routes
  _.each(routes, r => app.use(mount(require(r.path))));

  app.use(function* (){
    this.status = 404;
    this.body = 'savevideobot.com - api not found'
  });

  return app;
}
