const Component = require('./Component')

module.exports = class NewLegislatures extends Component {
  onclick(event) {
    event.preventDefault()
    return { isContactWidgetVisible: !this.state.isContactWidgetVisible }
  }
  render() {
    return this.html`
      <section class="section">
        <div class="container">
          <h1 class="title is-3">Liquid democracy can create better governance everywhere, not just in US Congress.</h1>
          <div class="content">
            <p>We'd love to make <a href="/"><strong>United.vote</strong></a> available for more legislatures.</p>
            <h3 class="title is-4">To add new public legislatures, we need:</h3>

            <div class="control">
              <label class="checkbox">
                <input type="checkbox">
                  A source of new legislation introduced
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                <input type="checkbox">
                  The official district boundaries
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                <input type="checkbox">
                  A source of elected legislators and their voting records, to provide <a href="https://grades.united.vote"><strong>Liquid Scorecards</strong></a>
              </label>
            </div>

            <h3 class="title is-4">What United already covers:</h3>

            <div class="control">
              <label class="checkbox">
                <input type="checkbox" checked>
                  <strong>An easy-to-use interface</strong> to learn about, debate, and vote on items.
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                <input type="checkbox" checked>
                  <strong>Proxy to personal representatives.</strong> Search among existing users or directly from their profile page. Invite new people by email or their public Twitter handle.
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                <input type="checkbox" checked>
                  <strong>Quick & accurate identity verification</strong> to ensure a trustworthy civic space, free from fraud.
              </label>
            </div>
            <div class="control">
              <label class="checkbox">
                <input type="checkbox" checked>
                  <strong>Our secure <a href="https://secure.united.vote">Proof-of-Vote</a> cryptosystem for verifiable digital voting,</strong> that maintains voter privacy.
              </label>
            </div>

            <br />
            <br />
            <p><a onclick=${this}><strong>Reach out</strong></a> if you can help bring new legislatures online.</p>
            <br />
            <br />

            <h3 class="title is-4">We're also interested in piloting liquid democracy among private groups.</h3>

            <p><a href="http://private.united.vote" target="_blank"><strong>Learn more</strong></a> about bringing better governance to your organization.</p>
          </div>
        </div>
      </section>
    `
  }
}
