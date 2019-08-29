const { html } = require('../helpers')
const joinForm = require('./join-form')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUsers } = require('@fortawesome/free-solid-svg-icons/faUsers')
const { faAddressCard } = require('@fortawesome/free-solid-svg-icons/faAddressCard')
const { faCheckSquare } = require('@fortawesome/free-solid-svg-icons/faCheckSquare')

module.exports = (state, dispatch) => {
  return html`
    <div>
      <section class="section">
        <div class="container">
          ${joinForm(state, dispatch)}
        </div>
      </section>
      <div class="hero">
        <div class="hero-body">
          <h3 class="subtitle is-4 has-text-centered">Sign up in less than 5 minutes:</h3>
          <div class="container is-centered"><div class="columns">
            <div class="column has-text-centered">
              <h4 class="title is-4">
                <span class="has-text-grey-light">&#9312;</span><br /><br />
                <span class="icon">${icon(faUsers)}</span><br />
                Proxying
              </h4>
              <p>Choose optional personal representatives so your values will always be counted.</p>
            </div>
            <div class="column has-text-centered">
              <h4 class="title is-4">
                <span class="has-text-grey-light">&#9313;</span><br /><br />
                <span class="icon">${icon(faAddressCard)}</span><br />
                Verification
              </h4>
              <p>Confirm your identity to ensure 1-person-1-vote.</p>
            </div>
            <div class="column has-text-centered">
              <h4 class="title is-4">
                <span class="has-text-grey-light">&#9314;</span><br /><br />
                <span class="icon">${icon(faCheckSquare)}</span><br />
                Legislation
              </h4>
              <p>Vote directly on bills to hold your elected reps accountable.</p>
            </div>
          </div></div>
        </div>
      </div>
    </div>
  `
}
