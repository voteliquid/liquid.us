const { NODE_ENV, WWW_URL } = process.env
const { api } = require('../helpers')
const fetch = require('isomorphic-fetch')

exports.fetchOffices = ({ location, storage, user }) => (dispatch) => {
  const address = user && user.address

  if (address) {
    return api('/user_offices', { storage })
    .then((offices) => dispatch({ type: 'officesReceived', offices: offices || [] }))
    .catch((error) => dispatch({ type: 'error', error }))
  }

  let ip = location.ip

  if (!ip || (ip === '::1' && NODE_ENV !== 'production')) ip = '198.27.235.190'

  return fetch(`${WWW_URL}/rpc/geoip/${ip}`, {
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-cache',
    mode: 'no-cors',
  })
  .then(response => response.json())
  .then((geoip) => {
    if (!geoip) {
      return dispatch({ type: 'officesReceived', offices: [] })
    }
    return api('/rpc/point_to_offices', {
      method: 'POST',
      body: JSON.stringify({
        lon: Number(geoip.lon),
        lat: Number(geoip.lat),
        city: `${geoip.city}, ${geoip.region}`,
        state: geoip.region,
      }),
    })
    .then((offices) => {
      dispatch({ type: 'officesReceived', offices, geoip })
    })
  })
  .catch((error) => {
    console.error(error)
    dispatch({ type: 'error', error })
  })
}
