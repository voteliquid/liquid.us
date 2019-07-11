const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { error, vote } = state
  const loading = state.loading.endorsedFromSignupForm

  let action = 'Endorse'; let color = 'is-success'
  if (vote.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
  if (vote.position === 'abstain') { action = 'Weigh in'; color = 'is-success' }

  return html`
    <form method="POST" style="width: 100%;" method="POST" onsubmit=${handleForm(dispatch, { type: 'vote:endorsedFromSignupForm', vote })}>
      <div class="field">
        <label class="label has-text-grey">Your Name *</label>
        <div class="control has-icons-left">
          <input name="name" autocomplete="off" class=${`input ${error && error.field === 'name' && 'is-danger'}`} placeholder="John Doe" required />
          ${error && error.field === 'name'
            ? html`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`
            : html`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`
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
              ? html`<span class="icon is-small is-left"><i class="fas fa-exclamation-triangle"></i></span>`
              : html`<span class="icon is-small is-left"><i class="fa fa-user"></i></span>`
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
            ? html`<span class="icon is-small is-left"><i class="fa fas fa-exclamation-triangle"></i></span>`
            : html`<span class="icon is-small is-left"><i class="fa fa-map-marker-alt"></i></span>`
          }
          ${error && error.field === 'address' ? html`<p class="help is-danger">${error.message}</p>` : ''}
        </div>
        <p class="is-size-7" style="margin-top: .3rem;">So your reps know you're their constituent.</p>
      </div>
      <div class="field">
        <div class="control">
          <label class="checkbox">
            <input name="is_public" type="checkbox" checked />
            Share my name publicly
          </label>
        </div>
      </div>
      <div class="field">
        <div class="control">
          <button class=${`button ${color} is-fullwidth has-text-weight-bold fix-bulma-centered-text is-size-5 ${loading ? 'is-loading' : ''}`} disabled=${loading} type="submit">${action}</button>
        </div>
      </div>
    </form>
  `
}

const initGoogleMaps = (event) => window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
