const { WWW_DOMAIN } = process.env
const { handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')

module.exports = (state, dispatch) => {
  const { error } = state

  return html`
    <section class="section" >
      <div class="container is-widescreen">
        <div class="content">
          <h2 class="subtitle">Thank you for verifying</h2>
          <p>We will continue strengthening our verification system, and you may need to confirm another check in the future.</p>
          <p>You can now create your own profile page, so that other people can easily proxy to you.</p>
          <p>
            <form method="POST" onsubmit=${handleForm(dispatch, { type: 'onboard:savedUsername' })}>
              <label><strong>Pick a username:</strong></label>
              <div class="field is-horizontal">
                <div class="field-body">
                  <div class="field has-addons">
                    <p class="control">
                      <a class="button is-static">
                        ${WWW_DOMAIN}/
                      </a>
                    </p>
                    <div class="control has-icons-left is-expanded">
                      <input name="username" class=${`input ${error ? 'is-danger' : ''}`} placeholder="username (at least 5 characters)" />
                      ${error
                        ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
                        : html`<span class="icon is-small is-left">${icon(faUser)}</span>`
                      }
                      ${error ? html`<p class="help is-danger">${error.message}</p>` : ''}
                    </div>
                  </div>
                </div>
              </div>
              <div class="field is-grouped is-grouped-right">
                <div class="control">
                  <a class="button has-text-grey" href="/get_started?skip=t">Skip</a>
                </div>
                <div class="control">
                  <button class="button is-primary" type="submit">Next</button>
                </div>
              </div>
              <p class="has-text-right has-text-grey">
                You can skip for now if you don&#39;t want a public profile page.
              </p>
            </form>
          <p>
        </div>
      </div>
    </section>
  `
}
