const { html } = require('../helpers')
const editLegislationForm = require('./edit-legislation-form')

module.exports = (state, dispatch) => {
  const { username, verified } = state.user
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-5">Propose New Legislation</h2>
        ${username ? editLegislationForm(state, dispatch) : publicProfileRequiredMsg(verified)}
      </div>
    </section>
  `
}

const publicProfileRequiredMsg = (verified) => {
  return html`
    <p class="notification">
      You must create a public profile to propose legislation.
      ${verified
        ? html`<a href="/get_started">Choose a username</a> and make a public profile.</a>`
        : html`<a href="/get_started">Verify your identity</a> to choose a username and make a public profile.</a>`
      }
    </p>
  `
}
