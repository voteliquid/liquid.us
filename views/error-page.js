const { html } = require('../helpers')

module.exports = (state, dispatch) => {
  return html`
    <div class="hero is-halfheight is-warning">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title">Uh oh! An error occurred on our end.</h1>
          <p class="subtitle">Refresh the page and try again, and <a style=${{ textDecoration: 'underline' }} onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })} href="mailto:support@democracy.space">contact support</a> if the problem persists.</p>
        </div>
      </div>
    </div>
  `
}
