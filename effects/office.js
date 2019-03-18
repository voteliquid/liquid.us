const { NODE_ENV, WWW_URL } = process.env
const { api } = require('../helpers')
const fetch = require('isomorphic-fetch')

exports.fetchOfficesFromAddress = (user) => (dispatch) => {
  return api(dispatch, '/user_offices', { user })
  .then((offices) => dispatch({ type: 'office:receivedList', offices: offices || [] }))
  .catch((error) => dispatch({ type: 'error', error }))
}

exports.fetchOfficesFromIP = (ip) => (dispatch) => {
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
      return dispatch({ type: 'office:receivedList', offices: [] })
    }
    return api(dispatch, '/rpc/point_to_offices', {
      method: 'POST',
      body: JSON.stringify({
        lon: Number(geoip.lon),
        lat: Number(geoip.lat),
        city: `${geoip.city}, ${geoip.region}`,
        state: geoip.region,
      }),
    }, dispatch)
    .then((offices) => {
      dispatch({ type: 'office:receivedList', offices, geoip })
    })
  })
  .catch((error) => dispatch({ type: 'error', error }))
}
