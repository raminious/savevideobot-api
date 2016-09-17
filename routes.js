'use strict'

const _ = require('underscore');

const list = [{ path: './lib/authentication' }];

const routes = {
  user: [
    { path: 'access-token', auth: false },
  ],
  media: [
    { path: 'status', auth: false},
    { path: 'explore'},
    { path: 'download'}
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
