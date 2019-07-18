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
      <div>
        <div class="has-text-centered">
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

            

            <div class="field has-text-left">
              <strong><label for="idea">What policy idea deserves to go viral?</label><strong>
            </div>
            <style>
              .join-input-field {
                margin-bottom: 10px 0 !important;
              }
            </style>
            <div class="field has-addons join-input-field">
              <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
                <textarea class="textarea" required placeholder="Create a healthier democracy by ..." />
              </div>
              
            </div>
            <div class="field has-text-left">
              <strong><label for="email">Your contact info</label><strong>
            </div>
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
                <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Submit</strong></button>
              </div>
              <div class="is-hidden-desktop">
                <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Submit</strong></button>
              </div>
            </div>
          </div>
            <div class="content">
              <div class="has-text-grey is-size-7">We will never share your email with anyone.</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
}
