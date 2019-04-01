const { GOOGLE_GEOCODER_KEY } = process.env
const gmaps = require('@google/maps')
const Promise = require('bluebird')

module.exports = (req, res, next) => {
  const client = gmaps.createClient({
    key: GOOGLE_GEOCODER_KEY,
    Promise,
  })

  client.geocode({
    address: req.body.address,
    components: {
      country: 'US',
      administrative_area: req.body.state,
    },
  }).asPromise()
    .then((gres) => res.json(gres.json.results))
    .catch(next)
}
