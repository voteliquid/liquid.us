const { WWW_DOMAIN } = process.env
const atob = require('atob')
const debug = require('debug')('liquid:models:session')
const { api, combineEffects, redirect } = require('../helpers')
const { refreshPageWhenAuthed } = require('../effects/page')
const { fetchMetrics } = require('../effects/metrics')
const { createSession, signIn } = require('../effects/session')

module.exports = (event, state) => {
  switch (event.type) {
    case 'session:error':
      return [{ ...state, error: event.error, loading: {} }]
    case 'session:signIn':
      return [{ ...state, loading: { ...state.loading, signIn: true } }, signIn({ ...event })]
    case 'session:signedOut':
      return [{ ...state, user: null }, signOut(state.user)]
    case 'session:requestOTP':
      return [state, requestOTP(event)]
    case 'session:verifyOTP':
      return [{ ...state, loading: { ...state.loading, signIn: true } }, verifyOTP(event)]
    case 'pageLoaded':
      switch (state.location.route) {
        case '/join':
          if (state.user) return [state, redirect('/')]
          if (state.location.query.ph) {
            return [state, updatePhoneNumber(atob(state.location.query.ph), state.user)]
          }
          return [{ ...state, location: { ...state.location, title: 'Join' } }, combineEffects([
            fetchMetrics,
            state.cookies.proxying_user_id && fetchProxyingProfile({ id: state.cookies.proxying_user_id }),
          ])]
        case '/sign_in':
          if (state.user) return [state, redirect('/')]
          return [{
            ...state,
            location: { ...state.location, title: 'Sign in' }
          }, state.cookies.proxying_user_id && fetchProxyingProfile({ id: state.cookies.proxying_user_id })]
        case '/sign_in/verify':
          if (state.user) return [state, redirect('/')]
          if (state.location.query.totp) {
            return [{
              ...state,
              loading: { ...state.loading, page: true },
              location: { ...state.location, title: 'Sign in' },
            }, verifyOTP({
              totp: state.location.query.totp,
              device_id: state.cookies.device_id,
              device_desc: state.location.userAgent || 'Unknown',
              redirect_to: state.cookies.redirect_to || '/get_started',
            })]
          }
          return [{ ...state, location: { ...state.location, title: 'Sign in' } }, refreshPageWhenAuthed]
        case '/sign_out':
          return [{ ...state, loading: { page: true }, user: null }, signOut(state.user)]
        default:
          return [state]
      }
    default:
      return [state]
  }
}

const signOut = (user) => (dispatch) => {
  dispatch({ type: 'cookieUnset', key: 'device_id' })
  dispatch({ type: 'cookieUnset', key: 'jwt' })
  dispatch({ type: 'cookieUnset', key: 'refresh_token' })
  dispatch({ type: 'cookieUnset', key: 'user_id' })
  dispatch({ type: 'cookieUnset', key: 'role' })
  dispatch({ type: 'cookieUnset', key: 'proxying_user_id' })
  dispatch({ type: 'cookieUnset', key: 'proxied_user_id' })
  dispatch({ type: 'cookieUnset', key: 'vote_position' })
  dispatch({ type: 'cookieUnset', key: 'vote_bill_id' })
  dispatch({ type: 'cookieUnset', key: 'vote_bill_short_id' })
  dispatch({ type: 'cookieUnset', key: 'vote_comment' })
  dispatch({ type: 'cookieUnset', key: 'endorsed_vote_id' })
  dispatch({ type: 'cookieUnset', key: 'endorsed_measure_id' })
  dispatch({ type: 'cookieUnset', key: 'endorsed_url' })

  if (user && user.refresh_token) {
    return api(dispatch, `/sessions?select=jwt&refresh_token=eq.${user.refresh_token}`, {
      method: 'DELETE',
      user,
    })
    .catch(debug)
    .then(() => dispatch({ type: 'redirected', url: '/' }))
  }

  dispatch({ type: 'redirected', url: '/' })
}

const requestOTP = ({ email, event, device_desc }) => (dispatch) => {
  if (event) event.preventDefault()

  if (!email) {
    return dispatch({ type: 'redirected', url: '/sign_in' })
  }

  return api(dispatch, '/totp?select=device_id', {
    method: 'POST',
    headers: { 'Prefer': 'return=representation' },
    body: JSON.stringify({
      email,
      device_desc,
      channel: 'join-page',
    }),
  })
  .then((results) => results[0])
  .then(({ device_id }) => {
    dispatch({ type: 'cookieSet', key: 'device_id', value: device_id })
    return dispatch({ type: 'redirected', url: '/sign_in/verify?notification=resent_code' })
  })
  .catch(error => {
    if (~error.message.indexOf('constraint "email')) {
      error.message = 'Invalid email address'
    } else if (error.message !== 'Please wait 10 seconds and try again') {
      error.message = `There was a problem on our end. Please try again and let us know if you're still encountering a problem.`
    }
    dispatch({ type: 'session:error', error })
  })
}

const verifyOTP = ({ totp, device_id, device_desc, redirect_to, event, ...extras }) => (dispatch) => {
  if (event) event.preventDefault()

  const params = {
    totp: (totp || '').replace(/[^\d]/g, ''),
    device_id,
    device_desc,
  }

  debug(params)

  return createSession(dispatch, params, extras).then(() => {
    if (redirect_to) {
      dispatch({ type: 'cookieUnset', key: 'redirect_to' })
      return dispatch({ type: 'redirected', url: redirect_to })
    }

    return dispatch({ type: 'redirected', url: '/get_started' })
  })
  .catch((error) => {
    if (~error.message.indexOf('expired')) {
      error.message = 'Invalid or expired one-time sign in code.'
    } else {
      error.message = `Something went wrong on our end.<br />Please contact support@${WWW_DOMAIN} and help us fix it.`
    }
    dispatch({ type: 'session:error', error })
  })
}

const updatePhoneNumber = (phone_number, user) => (dispatch) => {
  return api(dispatch, `/users?id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ phone_number }),
    user,
  })
  .then(() => dispatch({ type: 'redirected', url: '/' }))
}

const fetchProxyingProfile = ({ id, username, user }) => (dispatch) => {
  const url = username
    ? `/user_profiles?or=(username.eq.${username},twitter_username.eq.${username})`
    : `/user_profiles?user_id=eq.${id}`

  return api(dispatch, url, { user }).then(([profile]) => {
    if (profile) {
      profile.name = `${profile.first_name} ${profile.last_name}`

      if (profile.twitter_username && !profile.username) {
        profile.name = profile.twitter_displayname
      }

      dispatch({ type: 'profile:received', profile })
    }
  })
  .catch((error) => dispatch({ type: 'session:error', error }))
}
