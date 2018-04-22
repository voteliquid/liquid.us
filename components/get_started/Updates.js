const Component = require('../Component')

module.exports = class GetStartedUpdatesPage extends Component {
  oninit() {
    if (!this.state.user) return this.location.redirect('/sign_in')
  }

  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url) {
      return this.oninit()
    }
  }

  onsubmit(event, formData) {
    event.preventDefault()

    const { user } = this.state
    const { update_emails_preference } = formData

    const nextPage = this.location.query.skipped_proxies
      ? '/get_started?skip=true'
      : '/get_started/verification'

    return this.api(`/users?select=id&id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        update_emails_preference,
      }),
    })
    .then(() => this.location.redirect(303, nextPage))
  }

  render() {
    const { user } = this.state

    return this.html`
      <section class="section">
        <div class="container">
            <div class="content" style="max-width: 650px;">
              <h2 class="subtitle">Updates</h2>
              <form method="POST" onsubmit=${this} action=${this}>
                <p>
                  Would you like <strong>automatic update emails</strong> about what your legislators have been voting on, how much they’re listening to constituents, and general updates about United?
                </p>
                <div class="field">
                  <div class="control">
                    <label class="radio">
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
                    <label class="radio">
                      <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'never'} value="never">
                      Never
                    </label>
                  </div>
                </div>
                <div class="field">
                  <div class="control">
                    <button class="button is-primary" type="submit">Next</button>
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
