const { NODE_ENV, WWW_URL } = process.env
const { api, html } = require('../helpers')
const fetch = require('isomorphic-fetch')
const RepCard = require('./RepCard')

module.exports = {
  init: [{
    geoip: null,
    location: null,
    reps: null,
    user: null,
    storage: null,
  }, (dispatch) => dispatch({ type: 'initialized' })],
  update: (event, state) => {
    switch (event.type) {
      case 'apiError':
        return [{ ...state, reps_loaded: true, reps: [] }]
      case 'initialized':
        return [state, fetchReps(state)]
      case 'repsLoaded':
      default:
        return [state]
    }
  },
  view: ({ geoip, location, reps = [], reps_loaded, user }) => {
    return html()`
      <div class="YourLegislators">
        <h2 class="title is-5">Your Elected Congress Members</h2>
        ${(reps_loaded && (!reps || !reps.length)) ? [`<div class="notification">We weren't able to detect your elected congress members using your location. <a href="/join">Join to set your address</a>.</div>`] : []}
        <div class="columns">
          ${reps.map(rep => RepColumn({ rep }))}
        </div>
        ${geoip && reps && reps.length ? AddAddressNotification({ geoip, user }) : []}
        ${user && user.address && [`
          <div class="has-text-right has-text-grey is-size-7">
            <p>Based on your address of <strong>${user.address.address}</strong>. <a href="/change_address?from=${location.path}">Change</a>
          </div>
        `]}
      </div>
    `
  },
}

const fetchReps = ({ location, reps_loaded, refresh, storage, user }) => (dispatch) => {
  if (!refresh && reps_loaded) return

  const address = user && user.address

  if (address) {
    return api('/rpc/user_offices', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id }),
      storage,
    })
    .then((reps) => dispatch({ type: 'repsLoaded', reps: reps || [] }))
  }

  let ip = location.ip || '198.27.235.190'

  if (ip === '::1' && NODE_ENV !== 'production') ip = '198.27.235.190'

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
      return dispatch({ type: 'repsLoaded', reps: [] })
    }
    return api('/rpc/point_to_offices', {
      method: 'POST',
      body: JSON.stringify({ lon: Number(geoip.lon), lat: Number(geoip.lat) }),
      storage,
    })
    .then(reps => {
      if (!reps) reps = []
      storage.set('geoip_house_rep', reps[0] ? reps[0].user_id : 'not_found')
      dispatch({ type: 'repsLoaded', reps, geoip })
    })
  })
  .catch((error) => {
    console.error(error)
    dispatch({ type: 'apiError', error })
  })
}

const AddAddressNotification = ({ geoip, user }) => {
  return html()`
    ${user ? (user.address ? [] : AuthedAddressNotification({ geoip })) : AnonAddressNotification({ geoip })}
  `
}

const RepColumn = ({ rep }) => {
  return html(`repcolumn-${rep.user_id}`)`
    <div class="column">${RepCard({ rep })}</div>
  `
}

const AnonAddressNotification = ({ geoip }) => {
  return html()`
    <div class="notification">
      We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.regionName}.</strong> But this is only right about half the time. <strong><a href="/join">Set your address</a></strong>.
    </div>
  `
}

const AuthedAddressNotification = ({ geoip }) => {
  return html()`
    <div class="notification content">
      <p>We selected your reps by guessing your location in <strong>${geoip.city}, ${geoip.regionName}</strong>. But this is only right about half the time. <a href="/get_started/basics">Enter your address</a> to fix it.</p>
    </div>
  `
}
