const { api, html, redirect } = require('../helpers')
const ActivityIndicator = require('./ActivityIndicator')

module.exports = {
  init: ({ storage, user }) => [{
    storage,
    user,
  }, signOut(storage)],
  update: (event, state) => {
    switch (event.type) {
      case 'redirected':
        return [state, redirect(event.url)]
      case 'signedOut':
        return [{ ...state, user: null }]
      default:
        return [state]
    }
  },
  view: () => {
    return html()`
      <section class="section hero">
        <div class="hero-body has-text-centered">
          ${ActivityIndicator()}
        </div>
      </div>
    `
  },
}

const signOut = (storage) => (dispatch) => {
  if (storage) {
    const refresh_token = storage.get('refresh_token')

    storage.unset('device_id')
    storage.unset('jwt')
    storage.unset('refresh_token')
    storage.unset('user_id')
    storage.unset('role')
    storage.unset('proxying_user_id')
    storage.unset('proxied_user_id')
    storage.unset('vote_position')
    storage.unset('vote_bill_id')
    storage.unset('vote_bill_short_id')
    storage.unset('vote_comment')
    storage.unset('endorsed_vote_id')
    storage.unset('endorsed_measure_id')
    storage.unset('endorsed_url')

    if (refresh_token) {
      return api(`/sessions?select=jwt&refresh_token=eq.${refresh_token}`, {
        method: 'DELETE',
        storage,
      })
      .catch((error) => {
        console.error(error)
      })
      .then(() => dispatch({ type: 'signedOut' }))
      .then(() => dispatch({ type: 'redirected', url: '/' }))
    }

    dispatch({ type: 'signedOut' })
    dispatch({ type: 'redirected', url: '/' })
  }
}
