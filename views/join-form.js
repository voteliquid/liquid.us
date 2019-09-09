const { APP_NAME } = process.env
const { handleForm, html } = require('../helpers')
const atob = require('atob')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')
const { faLock } = require('@fortawesome/free-solid-svg-icons/faLock')

module.exports = ({ cookies, error, loading, location, profiles = {}, usersCount }, dispatch) => {
  const proxy_to = cookies.proxying_username || location.query.proxy_to
  const position = cookies.vote_position
  const endorsed_vote_id = cookies.endorsed_vote_id
  const proxyProfile = profiles[proxy_to]
  const hasError = error && error.field === 'email'

  return html`
    <div>
      ${proxy_to && proxyProfile ? html`
        <div class="notification has-text-centered is-info">
          Join ${APP_NAME} to proxy to ${proxyProfile.first_name} ${proxyProfile.last_name}.
        </div>
      ` : []}
      ${endorsed_vote_id ? html`
        <div class="notification -inline-block has-text-centered is-info">Create your account to save your endorsement.</div>
      ` : []}
      ${position ? html`
        <div class="notification has-text-centered is-info">Enter your email to save your vote and hold your representatives accountable.</div>
      ` : []}
      ${location.query.notification === 'rep_not_found' ? html`
        <div class="notification has-text-centered is-info">We could not automatically locate your representative. Join ${APP_NAME} to set your address.</div>
      ` : []}
      <h2 class="title has-text-centered">
        ${usersCount
          ? `Join ${usersCount} people for healthier democracy`
          : `Join for healthier democracy`
        }
      </h2>
      <br />

      <div class="level">
        <div class="level-item has-text-centered">
          <form class="box has-text-centered" method="POST" onsubmit="${handleForm(dispatch, { type: 'session:signIn' })}">
            <input name="channel" type="hidden" value="join-page" />
            <input name="device_desc" type="hidden" value="${location.userAgent || 'Unknown'}" />
            <input name="phone_number" type="hidden" value="${location.query.ph ? atob(location.query.ph) : ''}" />
            <input name="redirect_to" type="hidden" value="${cookies.redirect_to || '/get_started'}" />
            <input name="endorsed_vote_id" type="hidden" value="${cookies.endorsed_vote_id}" />
            <input name="endorsed_measure_id" type="hidden" value="${cookies.endorsed_measure_id}" />
            <input name="proxying_user_id" type="hidden" value="${cookies.proxying_user_id}" />
            <input name="position" type="hidden" value="${cookies.vote_position}" />
            <input name="vote_bill_id" type="hidden" value="${cookies.vote_bill_id}" />
            <input name="vote_comment" type="hidden" value="${cookies.vote_comment}" />
            <input name="vote_public" type="hidden" value="${cookies.vote_public}" />

            <div class="field">
              <label for="email">Enter your email to get started:</label>
            </div>
            <style>
              .join-input-field {
                margin: 30px 0 !important;
              }
            </style>

            <div class="field has-addons join-input-field">
              <div class="${`control is-expanded has-icons-left ${hasError ? 'has-icons-right' : ''}`}">
                <input name="email" class="${`input ${hasError ? 'is-danger' : ''}`}" type="text" required placeholder="you@example.com" />
                <span class="icon is-small is-left">
                  ${icon(faUser)}
                </span>
                ${hasError ? html`<span class="icon is-small is-right">
                  ${icon(faExclamationTriangle)}
                </span>` : ''}
                ${hasError ? html`<p class="help is-danger">${error.message}</p>` : ''}
              </div>
              ${/* use shorter submit button text for small screens */''}
              <div class="control">
                <div class="is-hidden-touch">
                  <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Create Account</strong></button>
                </div>
                <div class="is-hidden-desktop">
                  <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Join</strong></button>
                </div>
              </div>
            </div>

            <div class="content">
              <p>
                <span class="icon is-small has-text-grey-lighter">
                  ${icon(faLock)}
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
