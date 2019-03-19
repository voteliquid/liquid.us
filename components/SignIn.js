const { api, combineEffects, html, preventDefault, redirect } = require('../helpers')
const { signIn } = require('../effects')

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
        return [{ ...state, loading: true }, combineEffects(
          preventDefault(event.event),
          signIn({
            email: require('parse-form').parse(event.event.target).body.email,
            location: state.location,
            storage: state.storage
          })
        )]
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
