const Component = require('./Component')

module.exports = class SettingsUnsubscribePage extends Component {
  oninit() {
    const { unsubscribed } = this.state
    const { id: user_id, list } = this.location.query

    if (unsubscribed) return this.state

    return this.api('/unsubscribes', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ user_id, list }),
    })
    .then(() => {
      return { unsubscribed: true }
    })
    .catch(error => {
      console.log(error)
      if (error && error.message && !~error.message.indexOf('duplicate')) {
        return { error }
      }
    })
  }

  onpagechange(oldProps) {
    if (oldProps.url !== this.props.url) return this.oninit()
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
