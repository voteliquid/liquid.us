const { WWW_DOMAIN, WWW_URL } = process.env
const { api, combineEffects, html, preventDefault, redirect } = require('../helpers')

module.exports = {
  init: ({ location, storage, user }) => [{
    error: null,
    location,
    storage,
    user,
  }, initialize(location, storage, user)],
  update: (event, state) => {
    switch (event.type) {
      case 'error':
        return [{ ...state, error: event.error, loading: false }]
      case 'formSubmitted':
        return [{
          ...state,
          loading: true
        }, combineEffects(
          preventDefault(event.event),
          verifyOTP(event.event, state.location, state.storage, state.user)
        )]
      case 'newCodeRequested':
        return [state, combineEffects(
          preventDefault(event.event),
          requestOTP(state.location, state.storage)
        )]
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: ({ error, loading, location, storage }, dispatch) => {
    const sign_in_email = storage.get('sign_in_email')

    return html()`
      <section class="section">
        <div class="container has-text-centered">
          <h1 class="title">We emailed you a one-time code to sign in</h1>
          ${location.query.notification === 'resent_code' ? ['<div class="notification">We sent you a new one-time sign in code.</div>'] : ''}
          <div class="level">
            <div class="level-item">
              <form onsubmit=${(event) => dispatch({ type: 'formSubmitted', event })} class="box" method="POST">
                <div class="field">
                  <label for="totp">Enter the one-time code<br/> we emailed <strong>${sign_in_email || 'you'}</strong>:</label>
                </div>
                <div class="field has-addons">
                  <div class="control is-expanded has-icons-left has-icons-right">
                    <input name="totp" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="123 456" />
                    <span class="icon is-small is-left">
                      <i class="fa fa-unlock-alt"></i>
                    </span>
                    ${error ? [`<span class="icon is-small is-right">
                      <i class="fa fa-warning"></i>
                    </span>`] : ''}
                    ${error ? [`<p class="help is-danger">${error}</p>`] : ''}
                  </div>
                  <div class="control">
                    <button class="${`button is-primary ${loading ? 'is-loading' : ''}`}" disabled=${loading} type="submit"><strong>Enter</strong></button>
                  </div>
                </div>
                <div class="content has-text-left is-size-7 has-text-grey">
                  <p class="has-text-grey">Didn't receive it? It may take a minute.<br />Be sure to check your spam/junk folder.</p>
                  <p><a onclick=${(event) => dispatch({ type: 'newCodeRequested', event })} href="${`${WWW_URL}/sign_in`}">Send a new code</a></p>
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
  if (location.query.totp) {
    return verifyOTP(null, location, storage, user)(dispatch)
  }

  if (user) {
    return dispatch({ type: 'redirected', url: '/', status: 403 })
  }

  // Try to refresh the page every 10 seconds if the page is in the background
  // in case they verify in another window (from clicking link in sign_in email)
  if (typeof window === 'object') {
    const browserCookies = require('browser-cookies')

    document.addEventListener('visibilitychange', () => {
      if (browserCookies.get('jwt')) {
        window.location.reload()
      }
    }, false)

    setInterval(() => {
      if (document.hidden && browserCookies.get('jwt')) {
        window.location.reload()
      }
    }, 10000)
  }

  dispatch({ type: 'loaded' })
}

const requestOTP = (location, storage) => (dispatch) => {
  const sign_in_email = storage.get('sign_in_email')

  if (!sign_in_email) {
    return dispatch({ type: 'redirected', url: '/sign_in' })
  }

  return api('/totp?select=device_id', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      email: sign_in_email,
      device_desc: location.userAgent || 'Unknown',
    }),
  })
  .then((results) => results[0])
  .then(({ device_id }) => {
    storage.set('device_id', device_id)
    return dispatch({ type: 'redirected', url: '/sign_in/verify?notification=resent_code' })
  })
  .catch(error => {
    console.log(error)
    if (~error.message.indexOf('constraint "email')) {
      error.message = 'Invalid email address'
    } else if (error.message !== 'Please wait 10 seconds and try again') {
      error.message = `There was a problem on our end. Please try again and let us know if you're still encountering a problem.`
    }
    dispatch({ type: 'error', error })
  })
}

const verifyOTP = (event, location, storage, user) => (dispatch) => {
  const formData = event && require('parse-form').parse(event.target).body

  if (user && !location.query.totp) {
    return dispatch({ type: 'redirected', url: '/get_started' })
  }

  const signin_body = {
    totp: formData && formData.totp ? formData.totp.replace(/[^\d]/g, '') : location.query.totp,
    device_id: storage.get('device_id'),
    device_desc: location.userAgent,
  }

  return api('/sessions?select=refresh_token,user_id,jwt', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(signin_body),
  })
  .then((results) => results[0])
  .then(({ jwt, refresh_token, user_id }) => {
    storage.set('jwt', jwt, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })
    storage.set('refresh_token', refresh_token, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })
    storage.set('user_id', user_id, { expires: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)) })
    storage.unset('device_id')
    storage.unset('sign_in_email')

    return api(`/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`, { storage })
    .then(users => {
      dispatch({
        type: 'userReceived',
        user: { ...users[0], address: users[0].address[0] }
      })
      return { jwt, user_id }
    })
  })
  .then(({ user_id }) => {
    const proxying_user_id = storage.get('proxying_user_id')
    const redirect_to = storage.get('redirect_to')
    const vote_position = storage.get('vote_position')
    const endorsed_vote_id = storage.get('endorsed_vote_id')
    const endorsed_measure_id = storage.get('endorsed_measure_id')

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
        return dispatch({ type: 'redirected', url: '/get_started' })
      })
      .catch(error => {
        console.log(error)
        return dispatch({ type: 'redirected', url: '/get_started' })
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
        return dispatch({ type: 'redirected', url: '/get_started' })
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
        return dispatch({ type: 'redirected', url: '/get_started' })
      })
      .catch(error => {
        console.log(error)
        return dispatch({ type: 'redirected', url: '/get_started' })
      })
    }

    if (redirect_to) {
      storage.unset('redirect_to')
      return dispatch({ type: 'redirected', url: redirect_to })
    }

    return dispatch({ type: 'redirected', url: '/get_started' })
  })
  .catch((error) => {
    console.log(error)
    if (~error.message.indexOf('expired')) {
      error.message = 'Invalid or expired one-time sign in code.'
    } else {
      error.message = `Something went wrong on our end.<br />Please contact support@${WWW_DOMAIN} and help us fix it.`
    }
    dispatch({ type: 'error', error })
  })
}
