const { handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')

module.exports = ({ error, loading }, dispatch) => {

  return html`
    <div class="has-text-centered">
      <form class="box has-text-centered" method="POST" onsubmit="${handleForm(dispatch, { type: 'contactForm:submitCandidatePage', url: 'https://democracy.space/candidate' })}">
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
            <textarea class="textarea" name="message" required placeholder="Create a healthier democracy by ..." />
          </div>

        </div>
        <div class="field has-text-left">
          <strong><label for="email">Your contact info</label><strong>
        </div>
        <div class="field has-addons join-input-field">
          <div class="${`control is-expanded has-icons-left ${error ? 'has-icons-right' : ''}`}">
            <input name="email" class="${`input ${error ? 'is-danger' : ''}`}" type="text" required placeholder="you@example.com" />
            <span class="icon is-small is-left">
              ${icon(faUser)}
            </span>
            ${error ? html`<span class="icon is-small is-right">
              ${icon(faExclamationTriangle)}
            </span>` : ''}
            ${error ? html`<p class="help is-danger">${error.message}</p>` : ''}
          </div>
          <div class="control">
            <button class="${`button is-primary ${loading.signIn ? 'is-loading' : ''}`}" disabled=${loading.signIn} type="submit"><strong>Submit</strong></button>
          </div>
        </div>
        <div class="content">
          <div class="has-text-grey is-size-7">We will never share your email with anyone.</div>
        </div>
      </form>
    </div>
  `
}
