const { WWW_URL } = process.env
const { api, combineEffects, makePoint, preventDefault, redirect } = require('../helpers')
const { updateNameAndAddress } = require('../effects/user')
const { logPublicProfileCreated } = require('../effects/analytics')
const fetch = require('isomorphic-fetch')
const routes = require('../routes')

module.exports = (event, state) => {
  switch (event.type) {
    case 'pageLoaded':
      switch (state.location.route) {
        case '/get_started':
          return [{
            ...state,
            loading: {
              ...state.loading,
              page: true,
            },
          }, redirectToOnboardingStep(state.cookies, state.location.query, state.user)]
        case '/get_started/basics':
          if (!state.user) return [state, redirect('/sign_in')]
          return [state]
        case '/get_started/verification':
          if (!state.user) return [state, redirect('/sign_in?notification=verify')]
          if (state.user && (!state.user.first_name || !state.user.last_name)) {
            return [state, redirect('/get_started/basics')]
          }
          return [state]
        case '/get_started/profile':
          if (!state.user) return [state, redirect('/sign_in')]
          if (!state.user.phone_verified) return [state, redirect('/get_started/verification')]
          return [state, state.user.username && redirect(`/${state.user.username}`)]
        default:
          return [state]
      }
    case 'onboard:savedBasicInfo':
      return [{
        ...state,
        loading: { ...state.loading, user: true },
      }, combineEffects([
        preventDefault(event.event),
        saveBasicInfo(event, state.cookies, state.user),
      ])]
    case 'onboard:requestedVerificationCode':
      return [{
        ...state,
        error: null,
        loading: { ...state.loading, verification: true },
        forms: { ...state.forms, verification: { ...state.forms.verification, ...event } },
      }, combineEffects([
        preventDefault(event.event),
        requestOTP(event, state.user),
      ])]
    case 'onboard:enteredVerificationCode':
      return [{
        ...state,
        error: null,
        loading: { ...state.loading, verification: true },
      }, combineEffects([
        preventDefault(event.event),
        verifyOTP(event, state.user),
      ])]
    case 'onboard:toggledVerificationCodeForm':
      return [{
        ...state,
        error: null,
        loading: { ...state.loading, verification: false },
        forms: {
          ...state.forms,
          verification: {
            ...state.forms.verification,
            showVerifyCodeForm: !(state.forms.verification || {}).showVerifyCodeForm
          },
        },
      }, preventDefault(event.event)]
    case 'onboard:savedUsername':
      return [state, combineEffects([
        preventDefault(event.event),
        saveUsername(event, state.user),
        logPublicProfileCreated()
      ])]
    default:
      return [state]
  }
}

const redirectToOnboardingStep = (cookies, query, user) => (dispatch) => {
  if (!user) return dispatch({ type: 'redirected', url: '/join' })

  if (query.skip) return finishOrSkip(cookies, user, dispatch)

  if (!user.address || !user.voter_status) {
    return dispatch({ type: 'redirected', url: `/get_started/basics` })
  } else if (!user.phone_verified) {
    return dispatch({ type: 'redirected', url: `/get_started/verification` })
  } else if (!user.username) {
    return dispatch({ type: 'redirected', url: `/get_started/profile` })
  }

  return finishOrSkip(cookies, user, dispatch)
}

const finishOrSkip = (cookies, user, dispatch) => {
  const endorsed_url = cookies.endorsed_url
  if (endorsed_url) {
    dispatch({ type: 'cookieUnset', key: 'endorsed_url' })
    return dispatch({ type: 'redirected', url: endorsed_url })
  }

  if (cookies.proxied_user_id) {
    return api(dispatch, `/user_profiles?select=user_id,username&user_id=eq.${cookies.proxied_user_id}`, { user })
    .then(([user]) => {
      if (user) {
        return dispatch({ type: 'redirected', url: `/${user.username}` })
      }
      return dispatch({ type: 'redirected', url: '/activity' })
    })
  }

  if (cookies.vote_bill_short_id) {
    const bill_short_id = cookies.vote_bill_short_id
    dispatch({ type: 'cookieUnset', key: 'vote_bill_short_id' })
    return dispatch({ type: 'redirected', url: `/legislation/${bill_short_id}` })
  }

  return dispatch({ type: 'redirected', url: '/activity' })
}

const validateNameAndAddressForm = (address, name) => {
  const name_pieces = name.split(' ')

  if (name_pieces.length < 2) {
    return Object.assign(new Error('Please enter a first and last name'), { field: 'name' })
  } else if (name_pieces.length > 5) {
    return Object.assign(new Error('Please enter only a first and last name'), { field: 'name' })
  }

  if (!address.match(/ \d{5}/) && (!window.lastSelectedGooglePlacesAddress || !window.lastSelectedGooglePlacesAddress.lon)) {
    return Object.assign(
      new Error(`Please use your complete address including city, state, and zip code.`),
      { field: 'address' }
    )
  }
}

const saveBasicInfo = (formData, cookies, user) => (dispatch) => {
  const { address, voter_status } = formData
  const error = validateNameAndAddressForm(address, formData.name)

  if (error) return dispatch({ type: 'error', error })

  const name_pieces = formData.name.split(' ')
  const first_name = name_pieces[0]
  const last_name = name_pieces.slice(1).join(' ')

  return updateNameAndAddress({
    addressData: {
      address,
      locality: window.lastSelectedGooglePlacesAddress.locality,
      administrative_area_level_1: window.lastSelectedGooglePlacesAddress.administrative_area_level_1,
      administrative_area_level_2: window.lastSelectedGooglePlacesAddress.administrative_area_level_2,
      postal_code: window.lastSelectedGooglePlacesAddress.postal_code,
      country: window.lastSelectedGooglePlacesAddress.country,
      geocoords: makePoint(window.lastSelectedGooglePlacesAddress.lon, window.lastSelectedGooglePlacesAddress.lat),
    },
    nameData: { first_name, last_name, voter_status },
    user,
  })(dispatch)
  .then(() => {
    if (!cookies.proxying_user_id) {
      return dispatch({ type: 'redirected', url: '/get_started/verification' })
    }

    return api(dispatch, '/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        to_id: cookies.proxying_user_id,
        delegate_rank: 0,
      }),
      user,
    })
    .then(() => {
      dispatch({ type: 'cookieSet', key: 'proxied_user_id', value: cookies.proxying_user_id })
      dispatch({ type: 'cookieUnset', key: 'proxying_user_id' })
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

// username blacklist because profiles are accessed from /:username
const username_blacklist = Object.keys(routes).map((route) => route.split('/')[1]).filter(route => route)

const saveUsername = ({ username }, user) => (dispatch) => {
  if (username.length < 5) {
    return dispatch({ type: 'error', error: new Error('Minimum 5 characters') })
  }

  if (!(/^[a-zA-Z0-9_]*$/).test(username)) {
    return dispatch({ type: 'error', error: new Error('Only letters, numbers, and underscore allowed') })
  }

  if (~username_blacklist.indexOf(username)) {
    return dispatch({ type: 'error', error: new Error(`${username} is a reserved name. Please choose another.`) })
  }

  return api(dispatch, `/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ username, public_profile: true }),
    user,
  })
  .then(() => {
    dispatch({ type: 'user:updated', user: { username } })
    return dispatch({ type: 'redirected', url: `/${username}`, status: 303 })
  })
  .catch((error) => {
    if (~error.message.indexOf('username_unique')) {
      error.message = 'That username is already taken'
    }
    dispatch({ type: 'error', error })
  })
}

const requestOTP = ({ phone }, user) => (dispatch) => {
  if (!phone) {
    return dispatch({ type: 'error', error: new Error('You must enter a phone number.') })
  }

  phone = phone.replace(/\D/g, '')

  if (phone.length !== 10) {
    return dispatch({ type: 'error', error: new Error('Please enter a 10-digit US phone number.') })
  }

  return fetch(`${WWW_URL}/rpc/verify_phone_number`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number: phone }),
  })
  .then((res) => {
    if (res.status === 204) return res
    if (res.status === 400) {
      return res.json().then((error) => Promise.reject(error))
    }
    return res.json()
  })
  .then(() => api(dispatch, '/phone_verification_otp', {
    method: 'POST',
    body: JSON.stringify({ phone_number: phone, user_id: user.id }),
    headers: { Prefer: 'return=minimal' },
    user,
  }))
  .then(() => dispatch({ type: 'onboard:toggledVerificationCodeForm' }))
  .catch((error) => dispatch({ type: 'error', error }))
}

const verifyOTP = ({ phone, otp }, user) => (dispatch) => {
  return api(dispatch, '/phone_verifications', {
    method: 'POST',
    body: JSON.stringify({ otp, user_id: user.id, phone_number: phone }),
    headers: { Prefer: 'return=minimal' },
    user,
  })
  .then(() => dispatch({ type: 'user:updated', user: { phone_verified: true } }))
  .then(() => dispatch({ type: 'redirected', url: '/get_started/profile', status: 303 }))
  .catch((error) => dispatch({ type: 'error', error }))
}
