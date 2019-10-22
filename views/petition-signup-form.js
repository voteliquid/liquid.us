const { WWW_URL } = process.env
const { handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')
const { faMapMarkerAlt } = require('@fortawesome/free-solid-svg-icons/faMapMarkerAlt')
const { faEnvelope } = require('@fortawesome/free-solid-svg-icons/faEnvelope')

module.exports = (state, dispatch) => {
  const { loading, error, measure } = state
  const isPublic =
    measure && typeof measure.vote_public === 'boolean'
      ? measure.vote_public
      : true

  return html`
    <form method="POST" style="width: 100%;" method="POST" onsubmit=${handleForm(dispatch, { type: 'petition:signatureSignupFormSubmitted', measure })}>
      <div class="field">
        <label class="label has-text-grey">Your Name *</label>
        <div class="control has-icons-left">
          <input name="name" autocomplete="off" class=${`input ${error && error.field === 'name' && 'is-danger'}`} placeholder="John Doe" required />
          ${error && error.field === 'name'
            ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
            : html`<span class="icon is-small is-left">${icon(faUser)}</span>`
          }
          ${error && error.field === 'name' ? html`<p class="help is-danger">${error.message}</p>` : ''}
        </div>
      </div>
      <div class="field">
        <label class="label has-text-grey">Your Email *</label>
        <div class="field has-addons join-input-field">
          <div class="${`control is-expanded has-icons-left ${error && error.field === 'email' ? 'has-icons-right' : ''}`}">
            <input name="email" class="${`input ${error && error.field === 'email' ? 'is-danger' : ''}`}" type="text" placeholder="you@example.com" required />
            ${error && error.field === 'email'
              ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
              : html`<span class="icon is-small is-left">${icon(faEnvelope)}</span>`
            }
            ${error && error.field === 'email' ? html`<p class="help is-danger">This email is invalid.</p>` : ''}
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label has-text-grey">Your Address</label>
        <div class="control has-icons-left">
          <input onconnected=${initGoogleMaps} class=${`input ${error && error.field === 'address' && 'is-danger'}`} autocomplete="off" name="address" id="address_autocomplete_sidebar" placeholder="185 Berry Street, San Francisco, CA 94121" />
          ${error && error.field === 'address'
              ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
              : html`<span class="icon is-small is-left">${icon(faMapMarkerAlt)}</span>`
          }
          ${error && error.field === 'address' ? html`<p class="help is-danger">${error.message}</p>` : ''}
        </div>
        <p class="is-size-7" style="margin-top: .3rem;">So your reps know you're their constituent.</p>
      </div>
      <div class="field">
        <div class="control">
          <label class="checkbox">
            <input
              name="is_public"
              type="checkbox"
              checked="${isPublic}"
              onchange="${(event) => dispatch({ type: 'petition:signatureToggledPrivacyCheckbox', measure, event })}"
            />
            <span>Share my name publicly</span>
          </label>
          ${!isPublic ? html`
            <p class="is-size-7 has-text-grey">
              Your reps will still be able to see your name,
              so they know you're their real constituent.
            </p>
          ` : html``}
        </div>
      </div>
      <div class="field">
        <div class="control">
          <button class=${`button is-success is-fullwidth has-text-weight-bold fix-bulma-centered-text is-size-5 ${loading.form ? 'is-loading' : ''}`} disabled=${loading.form} type="submit">Sign Petition</button>
        </div>
      </div>
      <p class="is-size-7"><a href=${`${WWW_URL}/policies`} target="_blank">Read our commitment to your privacy</a></p>
    </form>
  `
}

const initGoogleMaps = (event) => window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
