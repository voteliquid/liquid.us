const Component = require('./Component')

module.exports = class Settings extends Component {
  oninit() {
    if (!this.state.user) {
      this.storage.set('redirect_to', '/settings')
      return this.location.redirect('/sign_in')
    }
  }
  onclick(event) {
    const selected = event.target.value
    const saved = this.state.user.update_emails_preference

    return {
      settings_unsaved: selected !== saved,
    }
  }
  onsubmit(event, formData) {
    event.preventDefault()

    const { user } = this.state
    const { update_emails_preference } = formData

    return this.api(`/users?select=id&id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        update_emails_preference,
      }),
    })
    .then(() => ({ settings_unsaved: false, user: { ...user, update_emails_preference } }))
  }
  render() {
    const { settings_unsaved, user } = this.state

    return this.html`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <h2 class="title is-5">Settings</h2>
            <div class="content">
              <form method="POST" onsubmit=${this} action=${this}>
                <p>
                  Would you like to receive email updates about what your legislators have been voting on, how much they’re listening to constituents, and general updates about United?
                </p>
                <div class="field">
                  <div class="control">
                    <label class="radio">
                      <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'daily'} value="daily" onclick=${this}>
                      Daily
                    </label>
                    <label class="radio">
                      <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'weekly'} value="weekly" onclick=${this}>
                      Weekly
                    </label>
                    <label class="radio">
                      <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'monthly'} value="monthly" onclick=${this}>
                      Monthly
                    </label>
                    <label class="radio">
                      <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'never'} value="never" onclick=${this}>
                      Never
                    </label>
                  </div>
                </div>
                <div class="field">
                  <div class="control">
                    ${settings_unsaved
                      ? [`<button class="button is-primary" type="submit">Save</button>`]
                      : [`<button class="button is-primary" type="submit" disabled>Saved</button>`]
                    }
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
