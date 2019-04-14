const { html } = require('../helpers')

module.exports = ({ location }) => {
  return html`
    <div class="hero is-fullheight is-dark">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title">There is nothing here at ${location.path}</h1>
          <p class="subtitle">You may have followed an outdated link or typed the address incorrectly.</p>
        </div>
      </div>
    </div>
  `
}
