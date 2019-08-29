const { handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faLock } = require('@fortawesome/free-solid-svg-icons/faLock')
const { faMapMarkerAlt } = require('@fortawesome/free-solid-svg-icons/faMapMarkerAlt')

module.exports = (state, dispatch) => {
  const { loading, user, measure } = state
  const isPublic =
    measure && typeof measure.vote_public === 'boolean'
      ? measure.vote_public
      : user.last_vote_public

  const name = [user.first_name, user.last_name].filter(a => a).join(' ')
  const address = user.address ? user.address.address : ''

  return html`
    <form method="POST" style="width: 100%;" method="POST" onsubmit=${handleForm(dispatch, { type: 'petition:signatureFormSubmitted', measure })}>
      <div class="field">
        <label class="label has-text-grey">Your Name *</label>
        <div class="control has-icons-right">
          <input name="name" autocomplete="off" class="input" placeholder="John Doe" required value="${name}" required disabled=${!!name} />
          <span class="icon is-small is-right">${name ? icon(faLock) : icon(faUser)}</span>
        </div>
      </div>
      <div class="field">
        <label class="label has-text-grey">Your Email *</label>
        <div class="field has-addons join-input-field">
          <div class="control is-expanded has-icons-right">
            <input name="email" class="input" type="text" placeholder="you@example.com" value=${user.email} required disabled />
            <span class="icon is-small is-right">${icon(faLock)}</span>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label has-text-grey">Your Address</label>
        <div class="control has-icons-right">
          <input onconnected=${initGoogleMaps} id="address_autocomplete_sidebar" class="input" autocomplete="off" name="address" placeholder="185 Berry Street, San Francisco, CA 94121" value="${address}" disabled=${!!address} />
          <span class="icon is-small is-right">${address ? icon(faLock) : icon(faMapMarkerAlt)}</span>
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
              onchange="${(event) => dispatch({ type: 'measure:signatureToggledPrivacyCheckbox', measure, event })}"
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
          <button class=${`button is-primary is-fullwidth has-text-weight-bold fix-bulma-centered-text is-size-5 ${loading.form ? 'is-loading' : ''}`} disabled=${loading.form} type="submit">Sign Petition</button>
        </div>
      </div>
    </form>
  `
}

const initGoogleMaps = (event) => window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
