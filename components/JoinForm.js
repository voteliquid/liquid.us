const { APP_NAME } = process.env
const { api, html, redirect } = require('../helpers')
const { signIn } = require('./SignIn')

module.exports = {
  init: ({ location, storage, user }) => [{
    error: null,
    loading: false,
    location,
    storage,
    showTitle: true,
    usersCount: null,
    user,
  }, initialize(location, storage)],
  update: (event, state) => {
    switch (event.type) {
      case 'formSubmitted':
        return [{ ...state, loading: true }, signIn(event.event, state.location, state.storage)]
      case 'metricsReceived':
        return [{ ...state, usersCount: event.usersCount }]
      case 'proxyProfileReceived':
        return [{ ...state, proxyProfile: event.proxyProfile }]
      case 'redirected':
        return [state, redirect(event.url, 302)]
      case 'error':
        return [{ ...state, error: event.error, loading: false }]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: ({ error, loading, location, proxyProfile, showTitle, usersCount, storage }, dispatch) => {
    const proxy_to = storage.get('proxying_user_id') || location.query.proxy_to
    const vote_position = storage.get('vote_position')
    const endorsed_vote_id = storage.get('endorsed_vote_id')

    return html()`
      <div>
        ${proxy_to && proxyProfile ? [`
          <div class="notification has-text-centered is-info">
            Join ${APP_NAME} to proxy to ${proxyProfile.first_name} ${proxyProfile.last_name}.
          </div>
        `] : []}
        ${endorsed_vote_id ? [`
          <div class="notification -inline-block has-text-centered is-info">Create your account to save your endorsement.</div>
        `] : []}
        ${vote_position ? [`
          <div class="notification has-text-centered is-info">Enter your email to save your vote and hold your representatives accountable.</div>
        `] : []}
        ${location.query.notification === 'rep_not_found' ? [`
          <div class="notification has-text-centered is-info">We could not automatically locate your representative. Join ${APP_NAME} to set your address.</div>
        `] : []}
        ${showTitle ? [`
          <h2 class="title has-text-centered">
            ${usersCount
              ? `Join ${usersCount} people for healthier democracy`
              : `Join for healthier democracy`
            }
          </h2>
          <br />
          `] : ''}

        <style>.center-on-small-widths { display: flex; }</style>
        <div class="columns is-centered center-on-small-widths">
          <div class="column" style="max-width: 500px;">
            <form class="box has-text-centered" method="POST" onsubmit="${(event) => dispatch({ type: 'formSubmitted', event })}">
              <input name="phone_user_id" type="hidden" value="${location.query.sms || ''}" />

              <div class="field">
                <label for="email">Enter your email to get started:</label>
              </div>
              <style>
                .join-input-field {
                  margin: 30px 0 !important;
                }
              </style>

              <div class="field has-addons join-input-field">
                <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                  <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" />
                  <span class="icon is-small is-left">
                    <i class="fa fa-user"></i>
                  </span>
                  ${error ? [`<span class="icon is-small is-right">
                    <i class="fa fa-warning"></i>
                  </span>`] : ''}
                  ${error ? [`<p class="help is-danger">This email is invalid</p>`] : ''}
                </div>
                ${/* use shorter submit button text for small screens */''}
                <div class="control">
                  <div class="is-hidden-touch">
                    <button class="${`button is-primary ${loading ? 'is-loading' : ''}`}" disabled=${loading} type="submit"><strong>Create Account</strong></button>
                  </div>
                  <div class="is-hidden-desktop">
                    <button class="${`button is-primary ${loading ? 'is-loading' : ''}`}" disabled=${loading} type="submit"><strong>Join</strong></button>
                  </div>
                </div>
              </div>

              <div class="content">
                <p>
                  <span class="icon is-small has-text-grey-lighter">
                    <i class="fa fa-lock"></i>
                  </span>
                  No need to choose a password &mdash; one less thing to forget or have compromised.
                </p>
                <p class="has-text-grey is-size-7">We will never share your email with anyone.</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
  }
}

const initialize = (location, storage) => (dispatch) => {
  fetchSignupMetrics(dispatch)
    .then(() => fetchProxyingProfile(location, storage)(dispatch))
    .then(() => dispatch({ type: 'loaded' }))
}

const fetchProxyingProfile = (location, storage) => (dispatch) => {
  const proxying_user_id = storage.get('proxying_user_id')
  const proxying_username = location.query.proxy_to
  if (proxying_user_id) {
    return api(`/user_profiles?select=user_id,first_name,last_name&user_id=eq.${proxying_user_id}`)
      .then(users => dispatch({ type: 'proxyProfileReceived', proxyProfile: users[0] }))
  }
  if (proxying_username) {
    return api(`/user_profiles?select=user_id,first_name,last_name&username=eq.${proxying_username}`)
      .then(users => {
        storage.set('proxying_user_id', users[0].user_id)
        dispatch({ type: 'proxyProfileReceived', proxyProfile: users[0] })
      })
  }
}

const fetchSignupMetrics = (dispatch) => {
  return api('/metrics?select=users_count')
    .then((metrics) => dispatch({ type: 'metricsReceived', usersCount: metrics[0] ? metrics[0].users_count : 0 }))
    .catch(() => dispatch({ type: 'metricsReceived', usersCount: 0 }))
}
