const { handleForm, html } = require('../helpers')
const atob = require('atob')

module.exports = ({ cookies, error, loading, location, profiles = {} }, dispatch) => {
  const proxying_username = cookies.proxying_username
  const vote_position = cookies.vote_position
  const endorsed_vote_id = cookies.endorsed_vote_id
  const reqProxyProfile = profiles[proxying_username]

  return html`
    <section class="section">
      <div class="container has-text-centered">
        ${location.query.notification === 'verify' ? html`
          <div class="columns is-centered is-gapless">
            <div class="column is-half">
              <div class="notification has-text-centered is-info">
                Sign in to finish verifying.
              </div>
            </div>
          </div>
        ` : []}
        ${location.query.notification === 'propose-legislation' ? html`
          <div class="columns is-centered is-gapless">
            <div class="column is-half">
              <div class="notification has-text-centered is-info">
                You must sign in before proposing legislation.
              </div>
            </div>
          </div>
        ` : []}
        ${proxying_username && reqProxyProfile ? html`
          <div class="columns is-centered is-gapless">
            <div class="column is-half">
              <div class="notification has-text-centered is-info">
                Sign in to proxy to ${reqProxyProfile.first_name} ${reqProxyProfile.last_name}.
              </div>
            </div>
          </div>
        ` : []}
        ${endorsed_vote_id ? html`
          <div class="columns is-centered is-gapless">
            <div class="column is-half">
              <div class="notification has-text-centered is-info">Sign in to save your endorsement.</div>
            </div>
          </div>
        ` : []}
        ${vote_position ? html`
          <div class="columns is-centered is-gapless">
            <div class="column is-half">
              <div class="notification has-text-centered is-info">Sign in to save your vote and hold your representatives accountable.</div>
            </div>
          </div>
        ` : []}
        <h1 class="title">Sign in</h1>
        <div class="level">
          <div class="level-item has-text-centered">
            <form onsubmit="${handleForm(dispatch, { type: 'session:signIn' })}" class="box" method="POST">
              <div class="field">
                <label for="email">Enter your email to sign in</label>
              </div>
              <div class="field has-addons">
                <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                  <input name="channel" type="hidden" value="sign-in-page" />
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
                  <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" />
                  <span class="icon is-small is-left">
                    <i class="fa fa-user"></i>
                  </span>
                  ${error ? html`<span class="icon is-small is-right">
                    <i class="fa fa-warning"></i>
                  </span>` : ''}
                  ${error ? html`<p class="help is-danger">${error.message}</p>` : ''}
                </div>
                <div class="control">
                  <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Sign in</strong></button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `
}
