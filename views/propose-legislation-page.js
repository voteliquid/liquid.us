const { html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const editLegislationForm = require('./edit-legislation-form')

module.exports = (state, dispatch) => {
  const { location, measures = {}, user } = state
  const measure = location.params.shortId && measures[location.params.shortId]
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-5">${measure ? 'Edit Legislation' : 'Propose New Legislation'}</h2>
        ${user.username
          ? location.params.shortId
            ? measure
              ? editLegislationForm(state, dispatch)
              : activityIndicator()
            : editLegislationForm(state, dispatch)
          : publicProfileRequiredMsg(user.verified)}
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
