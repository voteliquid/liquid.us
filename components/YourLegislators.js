const { NODE_ENV, WWW_URL } = process.env
const { api, html } = require('../helpers')
const fetch = require('isomorphic-fetch')
const RepCard = require('./RepCard')

module.exports = {
  init: ({ location, storage, user }) => [{
    location,
    geoip: null,
    offices: null,
    user,
    storage,
  }, fetchOffices(location, storage, user)],
  update: (event, state) => {
    switch (event.type) {
      case 'error':
        return [{ ...state, offices_loaded: true, offices: [] }]
      case 'officesLoaded':
      default:
        return [state]
    }
  },
  view: ({ geoip, location, offices = [], offices_loaded, user }) => {
    const reps = offices.filter((office) => office.office_holder)
    return html()`
      <div class="YourLegislators">
        <h2 class="title is-5">Your Elected Congress Members</h2>
        ${(offices_loaded && (!reps || !reps.length)) ? [`<div class="notification">We weren't able to detect your elected congress members using your location. <a href="/join">Join to set your address</a>.</div>`] : []}
        <div class="columns">
          ${reps.map((office) => RepColumn({ office }))}
        </div>
        ${geoip && offices && offices.length ? AddAddressNotification({ geoip, user }) : []}
        ${user && user.address && [`
          <div class="has-text-right has-text-grey is-size-7">
            <p>Based on your address of <strong>${user.address.address}</strong>. <a href="/change_address?from=${location.path}">Change</a>
          </div>
        `]}
      </div>
    `
  },
}

const fetchOffices = (location, storage, user) => (dispatch) => {
  const address = user && user.address

  if (address) {
    return api('/user_offices', { storage }).then((offices) => dispatch({ type: 'officesLoaded', offices: offices || [] }))
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
      return dispatch({ type: 'officesLoaded', offices: [] })
    }
    return Promise.resolve([])/* api('/rpc/point_to_offices', {
      method: 'POST',
      body: JSON.stringify({ lon: Number(geoip.lon), lat: Number(geoip.lat) }),
      storage,
    })*/
    .then(offices => {
      if (!offices) offices = []
      dispatch({ type: 'officesLoaded', offices, geoip })
    })
  })
  .catch((error) => {
    console.error(error)
    dispatch({ type: 'error', error })
  })
}

const AddAddressNotification = ({ geoip, user }) => {
  return html()`
    ${user ? (user.address ? [] : AuthedAddressNotification({ geoip })) : AnonAddressNotification({ geoip })}
  `
}

const RepColumn = ({ office }) => {
  const rep = office.office_holder
  return html(`repcolumn-${rep.user_id}`)`
    <div class="column">${RepCard({ rep, office })}</div>
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
