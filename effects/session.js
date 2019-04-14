const { logVote } = require('../effects/analytics')
const { api } = require('../helpers')
const debug = require('debug')('liquid:effects:session')

const createSession = exports.createSession = (dispatch, params, extras) => {
  return api(dispatch, '/sessions?select=refresh_token,user_id,jwt', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(params),
  }).then(([{ jwt, refresh_token, user_id }]) => {
    const oneYearFromNow = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000))

    dispatch({ type: 'cookieSet', key: 'jwt', value: jwt, opts: { expires: oneYearFromNow } })
    dispatch({ type: 'cookieSet', key: 'refresh_token', value: refresh_token, opts: { expires: oneYearFromNow } })
    dispatch({ type: 'cookieSet', key: 'user_id', value: user_id, opts: { expires: oneYearFromNow } })
    dispatch({ type: 'cookieUnset', key: 'device_id' })
    dispatch({ type: 'cookieUnset', key: 'sign_in_email' })

    return api(dispatch, `/users?select=id,email,first_name,last_name,username,verified,voter_status,update_emails_preference,address:user_addresses(id,address)&id=eq.${user_id}`, {
      user: { jwt, refresh_token },
    })
    .then(([user]) => {
      debug(user)
      const authedUser = { ...user, address: user.address[0], jwt, refresh_token }
      dispatch({ type: 'user:received', user: authedUser })
      return authedUser
    })
  })
  .then((user) => {
    return Promise.all([
      proxy(dispatch, user, extras),
      endorse(dispatch, user, extras),
      vote(dispatch, user, extras),
    ]).then(() => user)
  })
}

const endorse = (dispatch, user, params) => {
  if (params.endorsed_vote_id && params.endorsed_measure_id) {
    return api(dispatch, `/endorsements?user_id=eq.${user.id}`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        vote_id: params.endorsed_vote_id,
        measure_id: params.endorsed_measure_id
      }),
      user,
    })
    .then(() => {
      dispatch({ type: 'cookieUnset', key: 'endorsed_vote_id' })
      dispatch({ type: 'cookieUnset', key: 'endorsed_measure_id' })
    })
  }
}

const proxy = (dispatch, user, params) => {
  if (params.proxying_user_id) {
    return api(dispatch, '/delegations', {
      method: 'POST',
      headers: { Prefer: 'return=representation' }, // returns created delegation in response
      body: JSON.stringify({
        from_id: user.id,
        to_id: params.proxying_user_id,
        delegate_rank: 0,
      }),
      user,
    })
    .then(() => dispatch({ type: 'cookieUnset', key: 'proxying_username' }))
    .then(() => dispatch({ type: 'cookieUnset', key: 'proxying_user_id' }))
  }
}

const vote = (dispatch, user, params) => {
  if (params.vote_position && params.vote_bill_id) {
    return api(dispatch, '/rpc/vote', {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        measure_id: params.vote_bill_id,
        vote_position: params.vote_position,
        comment: params.vote_comment || null,
        public: params.vote_public === 'true',
      }),
      user,
    })
    .then(() => {
      logVote()
      dispatch({ type: 'cookieUnset', key: 'vote_position' })
      dispatch({ type: 'cookieUnset', key: 'vote_bill_id' })
      dispatch({ type: 'cookieUnset', key: 'vote_public' })
      dispatch({ type: 'cookieUnset', key: 'vote_comment' })
    })
  }
}

exports.signIn = ({ channel, email, device_desc, phone_number, redirect_to, event, ...extras }) => (dispatch) => {
  if (event) event.preventDefault()

  return api(dispatch, '/totp?select=device_id,first_seen', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      email: (email || '').toLowerCase().trim(),
      phone_number,
      device_desc,
      channel,
    }),
  })
  .then(([{ device_id, first_seen }]) => {
    if (first_seen) {
      return createSession(dispatch, { device_id, device_desc }, extras)
        .then((user) => {
          if (redirect_to) {
            dispatch({ type: 'redirected', url: redirect_to, status: 303 })
          }
          return user
        })
        .catch((error) => {
          dispatch({ type: 'error', error })
          dispatch({ type: 'redirected', url: redirect_to || '/sign_in', status: 303 })
        })
    }

    dispatch({ type: 'cookieSet', key: 'sign_in_email', value: email })
    dispatch({ type: 'cookieSet', key: 'device_id', value: device_id })
    dispatch({ type: 'redirected', url: '/sign_in/verify', status: 303 })
  })
  .catch((error) => {
    if (~error.message.indexOf('constraint "email')) {
      error.message = 'Invalid email address'
    } else if (error.message !== 'Please wait 10 seconds and try again') {
      error.message = `There was a problem on our end. Please try again and let us know if you're still encountering a problem.`
    }
    dispatch({ type: 'session:error', error })
  })
}
