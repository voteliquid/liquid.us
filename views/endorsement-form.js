const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { loading, user, vote } = state
  const isPublic =
    vote && typeof vote.endorsement_public === 'boolean'
      ? vote.endorsement_public
      : user.last_vote_public

  let action = 'Endorse'; let color = 'is-success'
  if (vote.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
  if (vote.position === 'abstain') { action = 'Weigh in'; color = 'is-success' }

  const name = [user.first_name, user.last_name].filter(a => a).join(' ')
  const address = user.address ? user.address.address : ''

  return html`
    <form method="POST" style="width: 100%;" method="POST" onsubmit=${handleForm(dispatch, { type: 'vote:endorsed', vote })}>
      <div class="field">
        <label class="label has-text-grey">Your Name *</label>
        <div class="control has-icons-right">
          <input name="name" autocomplete="off" class="input" placeholder="John Doe" required value="${name}" required disabled=${!!name} />
          <span class="icon is-small is-right"><i class="${`fa fa-${name ? 'lock' : 'user'}`}"></i></span>
        </div>
      </div>
      <div class="field">
        <label class="label has-text-grey">Your Email *</label>
        <div class="field has-addons join-input-field">
          <div class="control is-expanded has-icons-right">
            <input name="email" class="input" type="text" placeholder="you@example.com" value=${user.email} required disabled />
            <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="label has-text-grey">Your Address</label>
        <div class="control has-icons-right">
          <input onconnected=${initGoogleMaps} id="address_autocomplete_sidebar" class="input" autocomplete="off" name="address" placeholder="185 Berry Street, San Francisco, CA 94121" value="${address}" disabled=${!!address} />
          <span class="icon is-small is-right"><i class="${`fa fa-${address ? 'lock' : 'map-marker-alt'}`}"></i></span>
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
              onchange="${(event) => dispatch({ type: 'vote:endorsementToggledPrivacyCheckbox', vote, event })}"
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
          <button class=${`button ${color} is-fullwidth has-text-weight-bold fix-bulma-centered-text is-size-5 ${loading.vote ? 'is-loading' : ''}`} disabled=${loading.vote} type="submit">${action}</button>
        </div>
      </div>
    </form>
  `
}

const initGoogleMaps = (event) => window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
