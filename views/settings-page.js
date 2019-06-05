const { handleForm, html } = require('../helpers')

module.exports = ({ error, forms: { settings }, user }, dispatch) => {
  const formChanged = settings && (
       settings.subscribedDrip !== user.subscribedDrip
    || settings.subscribedLifecycle !== user.subscribedLifecycle
    || settings.update_emails_preference !== user.update_emails_preference
    || settings.inherit_votes_public !== user.inherit_votes_public
    || (settings.address && (!user.address || settings.address !== user.address.address))
    || settings.voter_status !== user.voter_status)
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-5">Settings</h2>
        <form method="POST" onsubmit=${handleForm(dispatch, { type: 'user:settingsSaved' })} onchange=${handleForm(dispatch, { type: 'user:settingsFormChanged' })}>
          <div class="field">
            <h3 class="title is-6 is-marginless">Notifications</h3>
          </div>
          <div class="field">
            <div class="control">
              <label class="checkbox">
                <input name="subscribedDrip" type="checkbox" checked=${user.subscribedDrip} />
                Send me educational emails about Liquid Democracy
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                <input name="subscribedLifecycle" type="checkbox" checked=${user.subscribedLifecycle} />
                Send me reminder emails about things I've missed
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                Send me update emails about what my reps have been voting:
              </label>
            </div>
          </div>
          <div style="margin-left: 2rem;">
            <div class="field">
              <div class="control">
                <label class="radio">
                  <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'never'} value="never">
                  Never
                </label>
                  <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'daily'} value="daily">
                  Daily
                </label>
                <label class="radio">
                  <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'weekly'} value="weekly">
                  Weekly
                </label>
                <label class="radio">
                  <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'monthly'} value="monthly">
                  Monthly
                </label>
              </div>
            </div>
          </div>
          <br />
          <div class="field">
            <h3 class="title is-6 is-marginless">Privacy</h3>
          </div>
          <div class="field">
            <label for="inherit_votes_public">Votes inherited by proxies should default to:</label>
            <div class="control">
              <div class="select is-small">
                <select name="inherit_votes_public">
                  <option value="true" selected=${user.inherit_votes_public}>Public (Vote Power: ${user.max_vote_power || 1})</option>
                  <option value="false" selected=${!user.inherit_votes_public}>Private (Vote Power: 1)</option>
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="is-6 label has-text-weight-semibold">Your Address</label>
            <div class="control has-icons-left">
              <input onconnected=${initAutocomplete} class=${`input ${error && error.address && 'is-danger'}`} autocomplete="off" name="address" id="address_autocomplete" required placeholder="185 Berry Street, San Francisco, CA 94121" value="${user.address ? user.address.address : ''}" />
              ${error && error.address
                ? html`<span class="icon is-small is-left"><i class="fa fas fa-exclamation-triangle"></i></span>`
                : html`<span class="icon is-small is-left"><i class="fa fa-map-marker-alt"></i></span>`
              }
              ${error && error.address ? html`<p class="help is-danger">${error.message}</p>` : ''}
            </div>
          </div>
          <div class="field">
            <label class="is-6 label has-text-weight-semibold">Are you registered to vote at this address?</label>
            <div class="control">
              <div class="select">
                <select name="voter_status" required>
                  <option>Pick one</option>
                  <option value="Registered" selected=${user.voter_status === 'Registered'}>Registered to vote</option>
                  <option value="Eligible" selected=${user.voter_status === 'Eligible'}>Not registered to vote</option>
                  <option value="Ineligible" selected=${user.voter_status === 'Ineligible'}>Not eligible to vote</option>
                </select>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="control">
              ${formChanged
                ? html`<button class="button is-primary" type="submit">Save</button>`
                : html`<button class="button is-primary" type="submit" disabled>Saved</button>`
              }
            </div>
          </div>
        </form>
      </div>
    </section>
  `
}

const initAutocomplete = (event) => {
  if (window.initGoogleAddressAutocomplete) {
    window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
  }
}
