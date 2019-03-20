const { APP_NAME, WWW_DOMAIN } = process.env
const { api, html, makePoint, redirect } = require('../../helpers')
const { updateNameAndAddress } = require('../../effects')

module.exports = {
  init: ({ location, storage, user }) => [{
    error: null,
    loading: false,
    location,
    storage,
    user,
  }, initialize(user)],
  update: (event, state) => {
    switch (event.type) {
      case 'addressInputConnected':
        return [state, initAutocomplete(event.event)]
      case 'error':
        return [{ ...state, error: event.error, loading: false }]
      case 'formSubmitted':
        return [{ ...state, error: null, loading: true }, handleFormSubmission(event.event, state.storage, state.user)]
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      case 'loaded':
      case 'officesUpdated':
      case 'userUpdated':
      default:
        return [{ ...state, error: null, loading: false }]
    }
  },
  view: ({ error, loading, location, user }, dispatch) => {
    return html()`
      <section class="section">
        <div class="container is-widescreen">
          <div class="content" style="max-width: 650px;">
            ${location.query.notification === 'proxy_wo_name' ? [`
              <div class="notification is-info">You must set your first and last name before proxying.</div>
            `] : []}
            ${error ? [`
              <div class="notification is-warning">${error.message}</div>
            `] : []}
            <h2 class="subtitle">Welcome.</h2>
            <h3 class="subtitle is-5">
              Help us locate your elected representatives:
            </h3>
            <form method="POST" onsubmit=${(event) => dispatch({ type: 'formSubmitted', event })}>
              <div class="field">
                <label class="label">Your Name:</label>
                <div class="control has-icons-left">
                  <input name="name" autocomplete="off" class=${`input ${error && error.name && 'is-danger'}`} placeholder="John Doe" required value="${[user.first_name, user.last_name].filter(a => a).join(' ')}" />
                  ${error && error.name
                    ? [`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`]
                    : [`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`]
                  }
                  ${error && error.name ? [`<p class="help is-danger">${error.message}</p>`] : ''}
                </div>
              </div>
              <div class="field">
                <label class="label">Your Address:</label>
                <div class="control has-icons-left">
                  <input onconnected=${(event) => dispatch({ type: 'addressInputConnected', event })} class=${`input ${error && error.address && 'is-danger'}`} autocomplete="off" name="address" id="address_autocomplete" required placeholder="185 Berry Street, San Francisco, CA 94121" value="${user.address ? user.address.address : ''}" />
                  ${error && error.address
                    ? [`<span class="icon is-small is-left"><i class="fa fas fa-exclamation-triangle"></i></span>`]
                    : [`<span class="icon is-small is-left"><i class="fa fa-map-marker-alt"></i></span>`]
                  }
                  ${error && error.address ? [`<p class="help is-danger">${error.message}</p>`] : ''}
                </div>
              </div>
              <div class="field">
                <label class="label">Are you registered to vote at this address?</label>
                <div class="control">
                  <div class="select">
                    <select name="voter_status" required>
                      <option>Pick one</option>
                      <option value="Registered" selected=${user.voter_status === 'Registered'}>Registered to vote</option>
                      <option value="Eligible" selected=${user.voter_status === 'Eligible'}>Not registered to vote</option>
                      <option value="Ineligible" selected=${user.voter_status === 'Ineligible'}>Not eligible to vote</option>
                    </select>
                  </div>
                </div>
              </div>
              <div class="field">
                <div class="control">
                  <button class="${`button is-primary ${loading ? 'is-loading' : ''}`}" disabled=${!!loading} type="submit">Next</button>
                </div>
              </div>
              <p class="help is-small has-text-grey">All of your information is kept strictly private.</p>
              <div class="expandable">
                <a onclick=${expand} href="#" class="is-size-7">Not in the US?</a>
                <p>As Americans, we're focused on our own democracy first, but we've heard many international requests to bring ${APP_NAME} to other countries.</p>
                <p>We want to make this much easier in the future.</p>
                <p>Write to us at <a href="${`mailto:international@${WWW_DOMAIN}`}" >international@${WWW_DOMAIN}</a> and tell us where you're from. We'd love to hear from you.</p>
                <p />
              </div>
              <style>
                .expandable { list-style: none; }
                .expandable > a::after {
                  content: '➤';
                  font-size: 70%;
                  position: relative;
                  left: 6px;
                  bottom: 2px;
                }
                .expandable.is-expanded > a::after { content: '▼'; }
                .expandable p, .expandable div, .expandable hr { display: none; }
                .expandable.is-expanded p, .expandable.is-expanded div, .expandable.is-expanded hr { display: block; }
              </style>
            </form>
          </div>
        </div>
      </section>
    `
  },
}

const initialize = (user) => (dispatch) => {
  if (!user) {
    return dispatch({ type: 'redirected', url: '/sign_in', status: 403 })
  }
  return dispatch({ type: 'loaded' })
}

const initAutocomplete = (event) => () => {
  if (window.initGoogleAddressAutocomplete) {
    window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
  }
}

const handleFormSubmission = (event, storage, user) => (dispatch) => {
  event.preventDefault()

  const formData = require('parse-form').parse(event.target).body

  const { address, voter_status } = formData

  const name_pieces = formData.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

  if (formData.name.split(' ').length < 2) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter a first and last name'), { name: true }) })
  } else if (formData.name.split(' ').length > 5) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter only a first and last name'), { name: true }) })
  }

  return updateNameAndAddress({
    addressData: {
      address,
      city: window.lastSelectedGooglePlacesAddress.city,
      state: window.lastSelectedGooglePlacesAddress.state,
      geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
    },
    nameData: { first_name, last_name, voter_status },
    storage,
    user,
  })(dispatch)
  .then(() => {
    if (!storage.get('proxying_user_id')) {
      return dispatch({ type: 'redirected', url: '/get_started/verification' })
    }

    return api('/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        to_id: storage.get('proxying_user_id'),
        delegate_rank: 0,
      }),
      storage,
    })
    .then(() => {
      storage.set('proxied_user_id', storage.get('proxying_user_id'))
      storage.unset('proxying_user_id')
      return dispatch({ type: 'redirected', url: '/get_started/verification' })
    })
    .catch(error => {
      console.log(error)
      return dispatch({ type: 'redirected', url: '/get_started/verification' })
    })
  })
  .catch((error) => {
    console.log(error)
    return dispatch({ type: 'redirected', url: '/get_started/verification' })
  })
}

function expand(event) {
  event.preventDefault()
  const target = event.currentTarget.parentNode
  if (target.className === 'expandable is-expanded') target.className = 'expandable'
  else if (target.className === 'expandable') target.className = 'expandable is-expanded'
}
