'use strict'

const _ = require('underscore');

const list = [{ path: './lib/authentication' }];

const routes = {
  user: [
    { path: 'signup', auth: false },
    { path: 'access-token', auth: false },
  ],
  media: [
    { path: 'update'},
    { path: 'status'},
    { path: 'explore'},
    { path: 'download'}
  ],
  client: [
    { path: 'version', auth: false }
  ]
};

_.each(routes, (group, name) => {
  _.each(group, r => {

    let item = {
      path: './lib/' + name + '/' + r.path
    };

    typeof r.auth === 'undefined'? list.push(item): list.unshift(item);
  })
});

module.exports = list;
