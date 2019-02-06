const { GOOGLE_GEOCODER_KEY, WWW_DOMAIN } = process.env
const { api, combineEffects, html, preventDefault, redirect } = require('../helpers')
const fetch = require('isomorphic-fetch')
const GoogleAddressAutocompleteScript = require('./GoogleAddressAutocompleteScript')

module.exports = {
  init: [{
    error: null,
    user: null,
    storage: null,
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'apiError':
        return [{ ...state, error: event.error }]
      case 'formSubmitted':
        return [state, combineEffects(
          preventDefault(event.event),
          postAddress(event.event.currentTarget, state.user, state.storage)
        )]
      case 'redirected':
        return [state, redirect(event.url)]
      case 'officesUpdated':
      case 'userUpdated':
      default:
        return [state]
    }
  },
  view: ({ error }, dispatch) => {
    return html()`
      <form method="POST" onsubmit=${(event) => dispatch({ type: 'formSubmitted', event })}>
        <div class="field is-horizontal">
          <div class="field-body">
            <div class="field">
              <label>Your Address</label>
              <div class="control has-icons-left">
                <input class=${`input ${error && 'is-danger'}`} name="address" id="address_autocomplete" placeholder="185 Berry Street, San Francisco, CA 94121" />
                <input name="lat" id="address_lat" type="hidden" />
                <input name="lon" id="address_lon" type="hidden" />
                <input name="city" id="city" type="hidden" />
                <input name="state" id="state" type="hidden" />
                ${GoogleAddressAutocompleteScript()}
                ${error
                  ? [`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`]
                  : [`<span class="icon is-small is-left"><i class="fa fa-map-marker"></i></span>`]
                }
                ${error && [`<p class="help is-danger">${error}</p>`]}
              </div>
            </div>
          </div>
        </div>
        <div class="field is-grouped is-grouped-right">
          <div class="control is-expanded">
            <span class="help has-text-right is-small has-text-grey">All of your information is kept strictly private.</span>
          </div>
          <div class="control">
            <button class="button is-primary" type="submit">Next</button>
          </div>
        </div>
      </form>
    `
  },
}

const postAddress = (form, user, storage) => (dispatch) => {
  const { address, lat, lon, city, state } = require('parse-form').parse(form).body
  if (!lat || !lon) {
    return fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${GOOGLE_GEOCODER_KEY}`)
      .then(response => response.json())
      .then(({ results }) => {
        if (results[0] && results[0].geometry && results[0].geometry.location) {
          const { location } = results[0].geometry
          return upsertAddressAndContinue({
            address: results[0].formatted_address || address,
            lat: location.lat,
            lon: location.lng,
            city,
            state,
            user,
            storage,
          })(dispatch)
        }
        return { error: `There was a problem processing your address. Please contact support@${WWW_DOMAIN} and let us know.` }
      })
      .catch(error => {
        console.log(error)
        return { error: `There was a problem processing your address. Please contact support@${WWW_DOMAIN} and let us know.` }
      })
  }

  return upsertAddressAndContinue({ address, city, state, lat, lon, user, storage })(dispatch)
}

const upsertAddressAndContinue = ({ address, city, state, lat, lon, user, storage }) => (dispatch) => {
  let addressUpsert

  if (user.address) {
    addressUpsert = api(`/user_addresses?select=id&user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        address,
        city,
        state,
        geocoords: `POINT(${lon} ${lat})`,
      }),
      storage,
    })
  } else {
    addressUpsert = api('/user_addresses', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: user.id,
        address,
        city,
        state,
        geocoords: `POINT(${lon} ${lat})`,
      }),
      storage,
    })
  }

  return addressUpsert
    .then(() => {
      return api('/user_offices', { storage }).then((offices) => dispatch({ type: 'officesUpdated', offices: offices || [] }))
    })
    .then(() => dispatch({
      type: 'userUpdated',
      user: {
        ...user,
        address,
      },
    }))
    .then(() => dispatch({ type: 'redirected', url: '/' }))
    .catch((error) => dispatch({
      type: 'apiError',
      error: (error.message.includes('constraint "email')) ? 'Invalid email address' : error.message,
    }))
}
