const { APP_NAME } = process.env
const { handleForm, html } = require('../helpers')
const atob = require('atob')

module.exports = ({ cookies, error, loading, location, profiles = {}, usersCount }, dispatch) => {
  const proxy_to = cookies.proxying_username || location.query.proxy_to
  const vote_position = cookies.vote_position
  const endorsed_vote_id = cookies.endorsed_vote_id
  const proxyProfile = profiles[proxy_to]

  return html`
    <div>
      ${proxy_to && proxyProfile ? html`
        <div class="notification has-text-centered is-info">
          Join ${APP_NAME} to proxy to ${proxyProfile.first_name} ${proxyProfile.last_name}.
        </div>
      ` : []}
      ${endorsed_vote_id ? html`
        <div class="notification has-text-centered is-info">Create your account to save your Backing.</div>
      ` : []}
      ${vote_position ? html`
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
            <input name="vote_position" type="hidden" value="${cookies.vote_position}" />
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
              <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" required placeholder="you@example.com" />
                <span class="icon is-small is-left">
                  <i class="fa fa-user"></i>
                </span>
                ${error ? html`<span class="icon is-small is-right">
                  <i class="fa fa-warning"></i>
                </span>` : ''}
                ${error ? html`<p class="help is-danger">${error.message}</p>` : ''}
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
                  <i class="fa fa-lock"></i>
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
