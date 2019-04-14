const { WWW_DOMAIN } = process.env
const { handleForm, html } = require('../helpers')

module.exports = ({ error, loading, forms: { verification: formData = {} }, user }, dispatch) => {
  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${!user ? signupMsg() : ''}
        ${user && user.verified ? alreadyVerifiedMsg() : ''}
        <div class="content">
          <h2 class="subtitle">Verify your identity</h2>
          <p>Verify your phone number to make sure your reps know you are their constituent.</p>
          <p>This also lets you create your own profile page, so you can start representing other people and increase your voting power.</p>
        </div>

        ${error ? html`
          <div class="notification is-warning">
            <p>${error.message}</p>
            <br />
            <p>Please contact <a href="${`mailto:support@${WWW_DOMAIN}`}">support@${WWW_DOMAIN}</a> if you need assistance.</p>
          </div>
        ` : ''}
        ${formData.showVerifyCodeForm
          ? verifyOtpForm(error, formData.phone, loading, dispatch)
          : requestOtpForm(error, loading, dispatch)}
      </div>
    </div>
  `
}

const signupMsg = () => {
  return html`
    <div class="notification is-warning">
      You'll need to <a href="/sign_in">sign in</a> or <a href="/join">join</a> first.
    </div>
  `
}

const alreadyVerifiedMsg = () => {
  return html`
    <div class="notification is-info">
      You've already verified! Good job.
    </div>
  `
}

const verifyOtpForm = (error, phone, { verification: loading }, dispatch) => {
  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'onboard:enteredVerificationCode', phone })}>
      <label for="otp" class="label is-size-6">Enter the code we sent to your phone:</label>
      <div class="field is-grouped">
        <div class="control has-icons-left">
          <input name="otp" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="123 578" />
          <span class="icon is-left"><i class="fa fa-key"></i></span>
          <p class="help">
            Didn't receive it?
            <a href="/get_started/verification" onclick=${(event) => dispatch({ type: 'onboard:toggledVerificationCodeForm', event })}>Try again</a>
            or <a href="#" onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}>contact support</a>.
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
            Skip verification for now
          </a>
        </div>
      </div>
    </form>
  `
}

const requestOtpForm = (error, { verification: loading }, dispatch) => {
  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'onboard:requestedVerificationCode' })}>
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
            Skip verification for now
          </a>
        </div>
      </div>
    </form>
  `
}
