const _ = require('underscore')
const list = [{ path: './endpoint/authentication' }]

const routes = {
  user: [
    { path: 'signup', auth: false },
    { path: 'access-token', auth: false },
    { path: 'remove-token' },
    { path: 'profile' },
    { path: 'info' },
  ],
  verify: [
    { path: 'send-email' },
    { path: 'verify-email' }
  ],
  password: [
    { path: 'forget', auth: false },
    { path: 'reset', auth: false },
    { path: 'change' }
  ],
  media: [
    { path: 'update' },
    { path: 'status' },
    { path: 'explore' },
    { path: 'download' },
    { path: 'list' },
    { path: 'live' }
  ],
  telegram: [
    { path: 'integration' },
    { path: 'add-bot' },
    { path: 'remove-bot' }
  ],
  client: [
    { path: 'version' }
  ]
};

_.each(routes, (group, name) => {
  _.each(group, r => {

    let item = {
      path: `./endpoint/${name}/${r.path}`
    }

    typeof r.auth === 'undefined' ? list.push(item) : list.unshift(item)
  })
})

module.exports = list
