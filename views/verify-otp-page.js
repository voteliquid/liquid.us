const { WWW_URL } = process.env
const { handleForm, html } = require('../helpers')

module.exports = ({ cookies, error, loading, location }, dispatch) => {
  const email = cookies.sign_in_email

  return html`
    <section class="section">
      <div class="container has-text-centered">
        <h1 class="title">We emailed you a one-time code to sign in</h1>
        ${location.query.notification === 'resent_code' ? html`<div class="notification">We sent you a new one-time sign in code.</div>` : ''}
        <div class="level">
          <div class="level-item">
            <form onsubmit=${handleForm(dispatch, { type: 'session:verifyOTP' })} class="box" method="POST">
              <div class="field">
                <label for="totp">Enter the one-time code<br/> we emailed <strong>${email || 'you'}</strong>:</label>
              </div>
              <div class="field has-addons">
                <div class="control is-expanded has-icons-left has-icons-right">
                  <input name="redirect_to" type="hidden" value="${cookies.redirect_to || '/get_started'}" />
                  <input name="device_id" type="hidden" value="${cookies.device_id}" />
                  <input name="device_desc" type="hidden" value="${location.userAgent || 'Unknown'}" />
                  <input name="endorsed_vote_id" type="hidden" value="${cookies.endorsed_vote_id}" />
                  <input name="endorsed_measure_id" type="hidden" value="${cookies.endorsed_measure_id}" />
                  <input name="proxying_user_id" type="hidden" value="${cookies.proxying_user_id}" />
                  <input name="position" type="hidden" value="${cookies.vote_position}" />
                  <input name="vote_bill_id" type="hidden" value="${cookies.vote_bill_id}" />
                  <input name="vote_comment" type="hidden" value="${cookies.vote_comment}" />
                  <input name="vote_public" type="hidden" value="${cookies.vote_public}" />
                  <input name="totp" class="${`input ${error ? 'is-danger' : ''}`}" type="text" placeholder="123 456" />
                  <span class="icon is-small is-left">
                    <i class="fa fa-unlock-alt"></i>
                  </span>
                  ${error ? html`<span class="icon is-small is-right">
                    <i class="fa fa-warning"></i>
                  </span>` : ''}
                  ${error ? html`<p class="help is-danger">${error.message}</p>` : ''}
                </div>
                <div class="control">
                  <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Enter</strong></button>
                </div>
              </div>
              <div class="content has-text-left is-size-7 has-text-grey">
                <p class="has-text-grey">Didn't receive it? It may take a minute.<br />Be sure to check your spam/junk folder.</p>
                <p><a onclick=${(event) => dispatch({ type: 'session:requestOTP', email, device_desc: location.userAgent || 'Unknown', event })} href="${`${WWW_URL}/sign_in`}">Send a new code</a></p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  `
}
