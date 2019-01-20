const { IPAPI_KEY } = process.env
const fetch = require('node-fetch')

module.exports = geoip

function geoip(req, res) {
  let ip = req.params.ip || req.ip

  if ((ip === '::1' || ip === '::ffff:127.0.0.1') && process.env.NODE_ENV !== 'production') {
    ip = '198.27.235.190'
  }

  const timeout = setTimeout(() => {
    res.json(null)
  }, 2000)

  fetch(`http://ip-api.com/json/${ip}${IPAPI_KEY ? `?key=${IPAPI_KEY}` : ''}`, {
    headers: { Accept: 'application/json' },
  })
  .then(response => response.json())
  .then((geoip) => {
    if (timeout) {
      clearTimeout(timeout)
      res.json(geoip)
    }
  })
  .catch((error) => {
    console.error(error)
    if (timeout) {
      clearTimeout(timeout)
      res.json(null)
    }
  })
}
