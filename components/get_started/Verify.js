const { WWW_URL, WWW_DOMAIN } = process.env
const fetch = require('isomorphic-fetch')
const { api, combineEffects, html, preventDefault, redirect } = require('../../helpers')

module.exports = {
  init: ({ storage, user }) => [{
    error: null,
    loading: false,
    showVerifyOtpForm: false,
    skipWarning: false,
    storage,
    user,
  }, initialize(user)],
  update: (event, state) => {
    switch (event.type) {
      case 'contactWidgetOpened':
        return [state, preventDefault(event.event)]
      case 'hideVerifyOtpForm':
        return [{ ...state, showVerifyOtpForm: false }, preventDefault(event.event)]
      case 'requestOtpFormSubmitted':
        const phoneInput = event.event.target.querySelector('input[name="phone"]')
        const phoneNum = (phoneInput.value || '').replace(/[^0-9]/g, '')
        if (phoneNum.length !== 10) {
          return [{
            ...state,
            error: 'Phone number must be 10-digit US number. Example: 111-222-3333'
          }, preventDefault(event.event)]
        }
        return [{ ...state, phoneNum, error: null }, combineEffects(
          preventDefault(event.event),
          requestOTP(phoneNum || '', state.user, state.storage)
        )]
      case 'requestedOtp':
      case 'requestedVerification':
        return [{ ...state, loading: true }]
      case 'receivedOtpError':
        console.error(event.error)
        if (~event.error.message.indexOf('was not found')) {
          return [{
            ...state,
            error: `The phone number you entered is not a valid U.S. carrier number. Are you sure you entered it correctly?`,
            loading: false
          }]
        }
        return [{ ...state, error: event.error.message, loading: false }]
      case 'sentOtp':
        return [{ ...state, loading: false, showVerifyOtpForm: true }]
      case 'redirected':
        if (!state.skipWarning && state.user && !event.skipWarning) {
          return [{ ...state, skipWarning: true }]
        }
        return [{ ...state, skipWarning: false }, redirect(event.url)]
      case 'verified':
        return [{
          ...state,
          loading: false,
          user: { ...state.user, verified: true }
        }, redirect('/get_started/profile')]
      case 'verifyOtpFormSubmitted':
        const otpInput = event.event.target.querySelector('input[name="otp"]')
        return [{ ...state, error: null }, combineEffects(
          preventDefault(event.event),
          verifyOTP(otpInput.value || '', state.user, state.phoneNum, state.storage)
        )]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: ({ error, loading, showVerifyOtpForm, skipWarning, user }, dispatch) => {
    return html()`
      <section class="section">
        <div class="container is-widescreen">
          ${!user ? signupMsg() : ''}
          ${user && user.verified ? alreadyVerifiedMsg() : ''}
          <div class="content">
            <h2 class="subtitle">Verify your identity</h2>
            <p>Verify your phone number to make sure your reps know you are their constituent.<br /><span class="has-text-grey">This also lets you create your own profile page, so you can start representing other people and increase your voting power.</span></p>
          </div>

          ${error ? [`
            <div class="notification is-warning">
              <p>${error}</p>
              <p>Please contact support@${WWW_DOMAIN} if you need assistance.</p>
            </div>
          `] : ''}
          ${showVerifyOtpForm
            ? verifyOtpForm({ error, loading, skipWarning }, dispatch)
            : requestOtpForm({ error, loading, skipWarning }, dispatch)}
        </div>
      </div>
    `
  },
}

const initialize = (user) => (dispatch) => {
  if (!user) {
    dispatch({ type: 'redirected', url: '/sign_in?notification=verify' })
  } else if (user && (!user.first_name || !user.last_name)) {
    dispatch({ type: 'redirected', url: '/get_started/basics', skipWarning: true })
  } else {
    dispatch({ type: 'loaded' })
  }
}

const requestOTP = (phone_number = '', user, storage) => (dispatch) => {
  dispatch({ type: 'requestedOtp' })
  fetch(`${WWW_URL}/rpc/verify_phone_number`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone_number }),
  })
  .then((res) => {
    if (res.status === 204) return res
    if (res.status === 400) {
      return res.json().then((error) => Promise.reject(error))
    }
    return res.json()
  })
  .then(() => api('/phone_verification_otp', {
    method: 'POST',
    body: JSON.stringify({ phone_number, user_id: user.id }),
    headers: { Prefer: 'return=minimal' },
    storage,
  }))
  .then(() => dispatch({ type: 'sentOtp' }))
  .catch((error) => dispatch({ type: 'receivedOtpError', error }))
}

const verifyOTP = (otp, user, phone_number, storage) => (dispatch) => {
  dispatch({ type: 'requestedVerification' })
  api('/phone_verifications', {
    method: 'POST',
    body: JSON.stringify({ otp, user_id: user.id, phone_number }),
    headers: { Prefer: 'return=minimal' },
    storage,
  })
  .then(() => dispatch({ type: 'verified' }))
  .catch((error) => dispatch({ type: 'receivedOtpError', error }))
}

const signupMsg = () => {
  return html()`
    <div class="notification is-warning">
      You'll need to <a href="/sign_in">sign in</a> or <a href="/join">join</a> first.
    </div>
  `
}

const alreadyVerifiedMsg = () => {
  return html()`
    <div class="notification is-info">
      You've already verified! Good job.
    </div>
  `
}

const verifyOtpForm = ({ error, loading, skipWarning }, dispatch) => {
  return html()`
    <form method="POST" onsubmit=${(event) => dispatch({ type: 'verifyOtpFormSubmitted', event })}>
      <label for="otp" class="label is-size-6">Enter the code we sent to your phone:</label>
      <div class="field is-grouped">
        <div class="control has-icons-left">

          <input name="otp" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="123 578" />
          <span class="icon is-left"><i class="fa fa-key"></i></span>
          <p class="help">
            Didn't receive it?
            <a href="/get_started/verification" onclick=${(event) => dispatch({ type: 'hideVerifyOtpForm', event })}>Try again</a>
            or <a href="#" onclick=${(event) => dispatch({ type: 'contactWidgetOpened', event })}>contact support</a>.
        </div>
      </div>
      <div class="field is-grouped">
        <div class="control">
          <button type="submit" disabled=${loading} class="${`button has-text-weight-semibold is-primary ${loading ? 'is-loading' : ''}`}">
            Verify Code
          </button>
        </div>
        <div class="control">
          <a class="is-size-7" onclick=${(event) => dispatch({ type: 'redirected', url: '/get_started?skip=t', event })}>
            ${skipWarning ? 'Confirm s' : 'S'}kip verification for now<br />
            ${skipWarning
              ? [`<p class="is-size-7">Are you sure? Your votes can't be counted until you verify.</p>`]
              : []
            }
          </a>
        </div>
      </div>
    </form>
  `
}

const requestOtpForm = ({ error, loading, skipWarning }, dispatch) => {
  return html()`
    <form method="POST" onsubmit=${(event) => dispatch({ type: 'requestOtpFormSubmitted', event })}>
      <label for="phone" class="label is-size-6">Your Phone Number:</label>
      <div class="field is-grouped">
        <div class="control has-icons-left">

          <input name="phone" class="${`input ${error ? 'is-danger' : ''}`}" type="tel" placeholder="(415) 123-1234" />
          <span class="icon is-left"><i class="fa fa-mobile-alt"></i></span>
          <p class="help">We won't share your number with anyone.</p>
        </div>
      </div>
      <div class="field is-grouped">
        <div class="control">
          <button type="submit" disabled=${loading} class="${`button has-text-weight-semibold is-primary ${loading ? 'is-loading' : ''}`}">
            Send Code
          </button>
        </div>
        <div class="control">
          <a class="is-size-7" onclick=${(event) => dispatch({ type: 'redirected', url: '/get_started?skip=t', event })}>
            ${skipWarning ? 'Confirm s' : 'S'}kip verification for now<br />
            ${skipWarning
              ? [`<p class="is-size-7">Are you sure? Your votes can't be counted until you verify.</p>`]
              : []
            }
          </a>
        </div>
      </div>
    </form>
  `
}
