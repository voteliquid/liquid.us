const { NODE_ENV, WWW_URL } = process.env
const { api } = require('../helpers')
const fetch = require('isomorphic-fetch')

exports.fetchOfficesFromAddress = (user) => (dispatch) => {
  return api(dispatch, '/user_legislatures_detailed', { user })
  .then((legislatures) => dispatch({ type: 'legislature:legislaturesAndOfficesReceived', legislatures }))
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
    return api(dispatch, '/rpc/point_to_legislatures_detailed', {
      method: 'POST',
      body: JSON.stringify({
        lon: Number(geoip.lon),
        lat: Number(geoip.lat),
        locality: geoip.city,
        administrative_area_level_1: geoip.regionName,
        administrative_area_level_2: null, // TODO find provider that gives county
        country: geoip.countryCode,
      }),
    }, dispatch)
    .then((legislatures) => dispatch({ type: 'legislature:legislaturesAndOfficesReceived', legislatures }))
  })
  .catch((error) => dispatch({ type: 'error', error }))
}
