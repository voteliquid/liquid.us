const { api, html, redirect } = require('../../helpers')
const ActivityIndicator = require('./../ActivityIndicator')

module.exports = {
  init: ({ location, storage, user }) => [{
    loading: true,
  }, initialize(location, storage, user)],
  update: (event, state) => {
    switch (event.type) {
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      default:
        return [state]
    }
  },
  view: () => {
    return html()`${ActivityIndicator()}`
  },
}

const initialize = (location, storage, user) => (dispatch) => {
  const { query } = location

  if (!user) return dispatch({ type: 'redirected', url: '/join' })

  if (query.skip) return finishOrSkip(storage, dispatch)

  if (!user.address || !user.voter_status) {
    return dispatch({ type: 'redirected', url: `/get_started/basics` })
  } else if (!user.verified) {
    return dispatch({ type: 'redirected', url: `/get_started/verification` })
  } else if (!user.username) {
    return dispatch({ type: 'redirected', url: `/get_started/profile` })
  }

  return finishOrSkip(storage, dispatch)
}


const finishOrSkip = (storage, dispatch) => {
  const endorsed_url = storage.get('endorsed_url')
  if (endorsed_url) {
    storage.unset('endorsed_url')
    return dispatch({ type: 'redirected', url: endorsed_url })
  }

  if (storage.get('proxied_user_id')) {
    return api(`/user_profiles?select=user_id,username&user_id=eq.${storage.get('proxied_user_id')}`, {
      storage,
    })
    .then(users => {
      if (users[0]) {
        return dispatch({ type: 'redirected', url: `/${users[0].username}` })
      }
      return dispatch({ type: 'redirected', url: '/legislation' })
    })
  }

  if (storage.get('vote_bill_short_id')) {
    const bill_short_id = storage.get('vote_bill_short_id')
    storage.unset('vote_bill_short_id')
    return dispatch({ type: 'redirected', url: `/legislation/${bill_short_id}` })
  }

  return dispatch({ type: 'redirected', url: '/legislation' })
}
