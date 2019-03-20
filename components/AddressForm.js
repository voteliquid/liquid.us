const { html, makePoint, redirect } = require('../helpers')
const { updateNameAndAddress } = require('../effects')

module.exports = {
  init: [{
    error: null,
    user: null,
    storage: null,
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'addressInputConnected':
        return [state, initAutocomplete(event.event)]
      case 'apiError':
        return [{ ...state, error: event.error }]
      case 'formSubmitted':
        return [state, handleFormSubmission(event.event, state.storage, state.user)]
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
                <input onconnected=${(event) => dispatch({ type: 'addressInputConnected', event })} class=${`input ${error && 'is-danger'}`} name="address" id="address_autocomplete" placeholder="185 Berry Street, San Francisco, CA 94121" />
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

const initAutocomplete = (event) => () => {
  if (window.initGoogleAddressAutocomplete) {
    window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
  }
}

const handleFormSubmission = (event, storage, user) => (dispatch) => {
  event.preventDefault()

  const formData = require('parse-form').parse(event.target).body

  return updateNameAndAddress({
    addressData: {
      address: formData.address,
      city: window.lastSelectedGooglePlacesAddress.city,
      state: window.lastSelectedGooglePlacesAddress.state,
      geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
    },
    nameData: {
      first_name: user.first_name,
      last_name: user.last_name,
    },
    storage,
    user,
  })(dispatch)
  .then(() => dispatch({ type: 'redirected', url: '/' }))
}
