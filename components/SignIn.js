const { api, html, redirect } = require('../helpers')
const atob = require('atob')

module.exports = {
  init: ({ location, storage, user }) => [{
    error: null,
    loading: false,
    location,
    reqProxyProfile: null,
    storage,
    user,
  }, initialize(location, storage, user)],
  update: (event, state) => {
    switch (event.type) {
      case 'error':
        return [{ ...state, error: event.error, loading: false }]
      case 'formSubmitted':
        return [{ ...state, loading: true }, signIn(event.event, state.location, state.storage)]
      case 'proxyProfileReceived':
        return [{ ...state, reqProxyProfile: event.reqProxyProfile }]
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      case 'userUpdated':
        return [{ ...state, user: { ...state.user, ...event.user } }]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: ({ error, loading, location, reqProxyProfile, storage }, dispatch) => {
    const proxying_user_id = storage.get('proxying_user_id')
    const vote_position = storage.get('vote_position')
    const endorsed_vote_id = storage.get('endorsed_vote_id')

    return html()`
      <section class="section">
        <div class="container has-text-centered">
          ${location.query.notification === 'verify' ? [`
            <div class="columns is-centered is-gapless">
              <div class="column is-half">
                <div class="notification has-text-centered is-info">
                  Sign in to finish verifying.
                </div>
              </div>
            </div>
          `] : []}
          ${location.query.notification === 'propose-legislation' ? [`
            <div class="columns is-centered is-gapless">
              <div class="column is-half">
                <div class="notification has-text-centered is-info">
                  You must sign in before proposing legislation.
                </div>
              </div>
            </div>
          `] : []}
          ${proxying_user_id && reqProxyProfile ? [`
            <div class="columns is-centered is-gapless">
              <div class="column is-half">
                <div class="notification has-text-centered is-info">
                  Sign in to proxy to ${reqProxyProfile.first_name} ${reqProxyProfile.last_name}.
                </div>
              </div>
            </div>
          `] : []}
          ${endorsed_vote_id ? [`
            <div class="columns is-centered is-gapless">
              <div class="column is-half">
                <div class="notification has-text-centered is-info">Sign in to save your endorsement.</div>
              </div>
            </div>
          `] : []}
          ${vote_position ? [`
            <div class="columns is-centered is-gapless">
              <div class="column is-half">
                <div class="notification has-text-centered is-info">Sign in to save your vote and hold your representatives accountable.</div>
              </div>
            </div>
          `] : []}
          <h1 class="title">Sign in</h1>
          <div class="level">
            <div class="level-item has-text-centered">
              <form onsubmit="${(event) => dispatch({ type: 'formSubmitted', event })}" class="box" method="POST">
                <div class="field">
                  <label for="email">Enter your email to sign in</label>
                </div>
                <div class="field has-addons">
                  <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                    <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-user"></i>
                    </span>
                    ${error ? [`<span class="icon is-small is-right">
                      <i class="fa fa-warning"></i>
                    </span>`] : ''}
                    ${error ? [`<p class="help is-danger">${error.message}</p>`] : ''}
                  </div>
                  <div class="control">
                    <button class="${`button is-primary ${loading ? 'is-loading' : ''}`}" disabled=${loading} type="submit"><strong>Sign in</strong></button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `
  },
}

const initialize = (location, storage, user) => (dispatch) => {
  const proxying_user_id = storage && storage.get('proxying_user_id')

  if (user) {
    return dispatch({ type: 'redirected', url: '/', status: 403 })
  }

  // If they got here from attempting to proxy from profile page
  if (location.query.notification === 'proxy' && proxying_user_id) {
    return api(`/user_profiles?select=user_id,first_name,last_name&user_id=eq.${proxying_user_id}`, { storage })
      .then(users => {
        if (users[0]) {
          dispatch({ type: 'proxyProfileReceived', reqProxyProfile: users[0] })
          dispatch({ type: 'loaded' })
        }
      })
  }

  dispatch({ type: 'loaded' })
}

const signIn = module.exports.signIn = (event, location, storage) => (dispatch) => {
  event.preventDefault()

  const formData = require('parse-form').parse(event.target).body

  const phone_number = location.query.ph ? atob(this.location.query.ph) : null
  const email = formData.email.toLowerCase().trim()
  const proxying_user_id = storage.get('proxying_user_id')
  const vote_position = storage.get('vote_position')
  const endorsed_vote_id = storage.get('endorsed_vote_id')
  const endorsed_measure_id = storage.get('endorsed_measure_id')
  const device_desc = location.userAgent || 'Unknown'

  return api('/totp?select=device_id,first_seen', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      email,
      phone_number,
      device_desc,
      channel: 'join-page',
    }),
  })
  .then((results) => results[0])
  .then(({ device_id, first_seen }) => {
    if (event.target && event.target.reset) {
      event.target.reset()
    }

    if (first_seen) {
      return api('/sessions?select=refresh_token,user_id,jwt', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({ device_id, device_desc }),
      }).then((results) => results[0])
      .then(({ jwt, refresh_token, user_id }) => {
        const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))

        storage.set('jwt', jwt, { expires: oneYearFromNow })
        storage.set('refresh_token', refresh_token, { expires: oneYearFromNow })
        storage.set('user_id', user_id, { expires: oneYearFromNow })

        return api(`/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`, {
          storage,
        })
        .then(users => {
          const proxy_to = location.query.proxy_to

          dispatch({ type: 'userUpdated', user: { ...users[0], address: users[0].address[0] } })

          if (proxying_user_id) {
            return api('/delegations', {
              method: 'POST',
              headers: { Prefer: 'return=representation' }, // returns created delegation in response
              body: JSON.stringify({
                from_id: user_id,
                to_id: proxying_user_id,
                delegate_rank: 0,
              }),
              storage,
            })
            .then(() => {
              storage.set('proxied_user_id', proxying_user_id)
              storage.unset('proxying_user_id')
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
            .catch(error => {
              console.log(error)
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
          }

          if (proxy_to) {
            return api('/delegations', {
              method: 'POST',
              headers: { Prefer: 'return=representation' }, // returns created delegation in response
              body: JSON.stringify({
                from_id: user_id,
                username: proxy_to,
                delegate_rank: 0,
              }),
              storage,
            })
            .then(() => {
              storage.set('proxied_user_id', proxying_user_id)
              storage.unset('proxying_user_id')
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
            .catch(error => {
              console.log(error)
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
          }

          if (endorsed_vote_id) {
            return api(`/endorsements?user_id=eq.${user_id}`, {
              method: 'POST',
              body: JSON.stringify({ user_id, vote_id: endorsed_vote_id, measure_id: endorsed_measure_id }),
              storage,
            })
            .then(() => {
              storage.unset('endorsed_vote_id')
              storage.unset('endorsed_measure_id')
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
          }

          if (vote_position) {
            return api('/rpc/vote', {
              method: 'POST',
              body: JSON.stringify({
                user_id,
                measure_id: storage.get('vote_bill_id'),
                vote_position,
                comment: storage.get('vote_comment') || null,
                public: storage.get('vote_public') === 'true',
              }),
              storage,
            })
            .then(() => {
              if (typeof window === 'object' && window._loq) window._loq.push(['tag', 'Voted'])
              storage.unset('vote_position')
              storage.unset('vote_bill_id')
              storage.unset('vote_public')
              storage.unset('vote_comment')
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
            .catch(error => {
              console.log(error)
              return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
            })
          }

          return dispatch({ type: 'redirected', url: '/get_started', status: 303 })
        })
      })
    }

    storage.set('sign_in_email', email)
    storage.set('device_id', device_id)

    return dispatch({ type: 'redirected', url: '/sign_in/verify', status: 303 })
  })
  .catch((error) => {
    console.log(error)
    if (~error.message.indexOf('constraint "email')) {
      error.message = 'Invalid email address'
    } else if (error.message !== 'Please wait 10 seconds and try again') {
      error.message = `There was a problem on our end. Please try again and let us know if you're still encountering a problem.`
    }
    dispatch({ type: 'error', error })
  })
}
