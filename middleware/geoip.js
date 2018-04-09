const fetch = require('node-fetch')

module.exports = geoip

function geoip(req, res, next) {
  let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress

  if (ip === '::1' && process.env.NODE_ENV !== 'production') {
    ip = '198.27.235.190'
  }

  fetch(`http://freegeoip.net/json/${ip}`, {
    headers: { Accept: 'application/json' },
  })
  .then(response => response.json())
  .then(geoip => res.json(geoip))
  .catch(next)
}
