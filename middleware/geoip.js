const fetch = require('node-fetch')

module.exports = geoip

function geoip(req, res, next) {
  let ip = req.params.ip || req.ip

  if ((ip === '::1' || ip === '::ffff:127.0.0.1') && process.env.NODE_ENV !== 'production') {
    ip = '198.27.235.190'
  }

  fetch(`http://ip-api.com/json/${ip}`, {
    headers: { Accept: 'application/json' },
  })
  .then(response => response.json())
  .then(geoip => res.json(geoip))
  .catch(next)
}
