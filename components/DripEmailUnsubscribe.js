const Component = require('./Component')

module.exports = class DripEmailUnsubscribePage extends Component {
  oninit() {
    if (this.state.drip_unsubscribed) return this.state

    return this.api(`/drip_emails?id=eq.${this.location.query.id}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ unsubscribed: true }),
    })
    .then(() => {
      console.log('successfully patched')
      return { drip_unsubscribed: true }
    })
    .catch(error => {
      console.log(error)
      return { error }
    })
  }

  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }

  render() {
    return this.html`
      <section class="section">
        <div class="columns is-centered" oninit=${this}>
          <div class="column is-half">
            <div class="content">
              <p class="title is-4">
                ${this.state.error
                  ? 'There was a problem saving your unsubscribe request.'
                  : `You have successfully unsubscribed.`
                }
              </p>
              <p>
                Please <a onclick=${this}>send a message</a> if this an error.
              </p>
            </div>
          </div>
        </div>
      </section>
    `
  }
}
