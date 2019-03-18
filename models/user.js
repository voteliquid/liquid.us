const { api, combineEffects, makePoint, preventDefault } = require('../helpers')
const { fetchUser, geocode, updateAddress } = require('../effects/user')

module.exports = (event, state) => {
  switch (event.type) {
    case 'user:settingsSaveError':
      return [state]
    case 'user:settingsSaved':
      const settings = {
        subscribedDrip: !!event.subscribedDrip,
        subscribedLifecycle: !!event.subscribedLifecycle,
        inherit_votes: !!event.inherit_votes,
        update_emails_preference: event.update_emails_preference,
        voter_status: event.voter_status,
      }
      return [{
        ...state,
        forms: {
          ...state.forms,
          settings,
        },
        user: {
          ...state.user,
          ...settings,
        },
      }, combineEffects([preventDefault(event.event), saveSettings(state.user, state.location, event)])]
    case 'user:settingsFormChanged':
      return [{ ...state, forms: { ...state.forms, settings: event } }]
    case 'user:settingsReceived':
      return [{ ...state, loading: { page: false }, user: { ...state.user, ...event.user } }]
    case 'user:unsubscribeError':
      return [{ ...state, error: event.error, loading: {} }]
    case 'user:unsubscribed':
      return [{ ...state, loading: {} }]
    case 'user:updated':
    case 'user:received':
      return [{
        ...state,
        loading: { ...state.loading, user: false, signIn: false, userProfile: false },
        user: { ...state.user, ...event.user },
      }]
    case 'pageLoaded':
      switch (state.location.route) {
        case '/settings':
          return [{
            ...state,
            loading: { page: true },
            location: { ...state.location, title: 'Settings' },
          }, fetchSettings(state.user)]
        case '/settings/unsubscribe':
          return [{
            ...state,
            loading: { page: true },
            location: { ...state.location, title: 'Unsubscribe' },
          }, unsubscribe(state.location.query.id, state.location.query.list)]
        default:
          return [state]
      }
    default:
      return [state]
  }
}

const fetchSettings = (user) => (dispatch) => {
  return api(dispatch, `/unsubscribes?user_id=eq.${user.id}`, { user }).then((unsubs) => {
    return api(dispatch, '/rpc/max_vote_power', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, since: new Date('1970').toISOString() }),
      user,
    }, dispatch).then((max_vote_power) => {
      user.max_vote_power = max_vote_power || 1
      user.subscribedDrip = !unsubs.some(({ list }) => list === 'drip')
      user.subscribedLifecycle = !unsubs.some(({ list }) => list === 'lifecycle')
      dispatch({ type: 'user:settingsReceived', user })
    })
  })
}

const saveSettings = (user, location, form) => (dispatch) => {
  const { address, subscribedDrip, subscribedLifecycle, inherit_votes, voter_status, update_emails_preference } = form

  const addressData = {
    address,
    city: window.lastSelectedGooglePlacesAddress.city,
    state: window.lastSelectedGooglePlacesAddress.state,
    geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
  }

  return api(dispatch, `/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      update_emails_preference,
      inherit_votes,
      voter_status,
    }),
    user,
  })
  .then(() =>
    (subscribedDrip ? deleteUnsubscribe(dispatch, user, 'drip') : postUnsubscribe(dispatch, user, 'drip')))
  .then(() =>
    (subscribedLifecycle ? deleteUnsubscribe(dispatch, user, 'lifecycle') : postUnsubscribe(dispatch, user, 'lifecycle')))
  .then(() => {
    if (!addressData.lon) {
      return geocode(addressData.address, addressData.state).then((newAddressData) => updateAddress(newAddressData, user, dispatch))
    }
    return updateAddress(addressData, user, dispatch)
  })
  .then(() => fetchUser(user.id, user.jwt, user.refresh_token, location.ip)(dispatch))
  .catch((error) => dispatch({ type: 'user:settingsSaveError', error }))
}

const deleteUnsubscribe = (dispatch, user, list) => {
  return api(dispatch, `/unsubscribes?user_id=eq.${user.id}&list=eq.${list}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
    user,
  })
}

const postUnsubscribe = (dispatch, user, list) => {
  return api(dispatch, `/unsubscribes?user_id=eq.${user.id}&list=eq.${list}`, {
    method: 'POST',
    headers: {
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id: user.id,
      list,
    }),
    user,
  })
}


const unsubscribe = (user_id, list) => (dispatch) => {
  api(dispatch, '/unsubscribes', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ user_id, list }),
  })
  .then(() => dispatch({ type: 'user:unsubscribed' }))
  .catch((error) => {
    if (~error.message.indexOf('unsubscribe_unique')) {
      dispatch({ type: 'user:unsubscribed' })
    } else {
      dispatch({ type: 'user:unsubscribeError', error })
    }
  })
}
