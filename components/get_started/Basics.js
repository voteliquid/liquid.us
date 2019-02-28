const { APP_NAME, WWW_DOMAIN } = process.env
const { api, html, makePoint, redirect } = require('../../helpers')
const GoogleAddressAutocompleteScript = require('../GoogleAddressAutocompleteScript')

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
      case 'error':
        return [{ ...state, error: event.error, loading: false }]
      case 'formSubmitted':
        return [{ ...state, error: null, loading: true }, patchUser(event.event, state.storage, state.user)]
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
                  <input name="address[name]" autocomplete="off" class=${`input ${error && error.name && 'is-danger'}`} placeholder="John Doe" required value="${[user.first_name, user.last_name].filter(a => a).join(' ')}" />
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
                  <input class=${`input ${error && error.address && 'is-danger'}`} autocomplete="off" name="address[address]" id="address_autocomplete" required placeholder="185 Berry Street, San Francisco, CA 94121" value="${user.address ? user.address.address : ''}" />
                  <input name="address[lat]" id="address_lat" type="hidden" />
                  <input name="address[lon]" id="address_lon" type="hidden" />
                  <input name="address[city]" id="city" type="hidden" />
                  <input name="address[state]" id="state" type="hidden" />
                  ${GoogleAddressAutocompleteScript()}
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
                    <select name="address[voter_status]" required>
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

const patchUser = (event, storage, user) => (dispatch) => {
  event.preventDefault()

  const formData = require('parse-form').parse(event.target).body

  const { address, lat, lon, city, state, voter_status } = formData.address

  const name_pieces = formData.address.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

  if (formData.address.name.split(' ').length < 2) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter a first and last name'), { name: true }) })
  } else if (formData.address.name.split(' ').length > 5) {
    return dispatch({ type: 'error', error: Object.assign(new Error('Please enter only a first and last name'), { name: true }) })
  }

  return upsertAddressAndContinue({ first_name, last_name, address, voter_status, lat, lon, city, state }, { storage, user }, dispatch)
}

const upsertAddressAndContinue = (formData, { storage, user }, dispatch) => {
  const { first_name, last_name, address, voter_status, lat, lon, city, state } = formData

  let addressUpsert

  if (user.address) {
    addressUpsert = api(`/user_addresses?select=id&user_id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        address,
        city,
        state,
        geocoords: makePoint(lon, lat),
      }),
      storage,
    })
  } else {
    addressUpsert = api(`/user_addresses?select=id&user_id=eq.${user.id}`, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: user.id,
        address,
        city,
        state,
        geocoords: makePoint(lon, lat),
      }),
      storage,
    })
  }

  return addressUpsert.then(() => api(`/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      first_name,
      last_name,
      voter_status,
    }),
    storage,
  }))
  .then(() => {
    dispatch({
      type: 'userUpdated',
      user: {
        ...user,
        voter_status,
        first_name,
        last_name,
        address: { address, city, state },
      },
    })
    return api('/user_offices', { storage }).then((offices) => {
      dispatch({ type: 'officesUpdated', offices: offices || [], offices_loaded: true })
    })
  })
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
