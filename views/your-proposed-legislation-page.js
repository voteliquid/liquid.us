const { html } = require('../helpers')
const loadingIndicator = require('../views/activity-indicator')
const editButtons = require('../views/measure-edit-buttons')

module.exports = (state, dispatch) => {
  const { user } = state
  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${user.username ? proposedLegislationList(state, dispatch) : publicProfileRequiredMsg(user.verified)}
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

const proposedLegislationList = (state, dispatch) => {
  const { loading, measures, user } = state
  const usersMeasures = Object.values(measures).filter(({ author_id }) => author_id === user.id)
  return html`
    <div>
      <style>
        .highlight-hover:hover {
          background: #f6f8fa;
        }
      </style>
      ${proposeButton()}
      <h2 class="title is-5">Your Proposed Legislation</h2>
      ${loading.page
        ? loadingIndicator()
        : usersMeasures.length
          ? usersMeasures.map((measure) => proposedLegislationItem(state, measure, dispatch))
          : html`<p>You have not proposed any legislation yet.</p>`}
    </div>
  `
}

const proposedLegislationItem = (state, measure, dispatch) => {
  const { user } = state
  const l = measure

  return html`
    <div class="card highlight-hover">
      <div class="card-content">
        <div class="columns">
          <div class="column">
            <h3><a href="${`/${user.username}/legislation/${l.short_id}`}">${l.title}</a></h3>
            <p class="is-size-7 has-text-grey">
              Proposed for ${l.legislature_name} &bullet; ${l.author_username
            ? html`Authored by <a href="${`/${l.author_username}`}">${l.author_first_name} ${l.author_last_name}</a> on ${(new Date(l.created_at)).toLocaleDateString()}`
            : html`Authored anonymously on ${(new Date(l.created_at)).toLocaleDateString()}`}
            </p>
          </div>
          <div class="column has-text-right has-text-left-mobile">
            ${editButtons(state, measure, dispatch)}
          </div>
        </div>
      </div>
    </div>
  `
}

const proposeButton = () => {
  return html`
    <a class="button is-pulled-right is-small" href="/legislation/propose">
      <span class="icon"><i class='fa fa-file'></i></span>
      <span class="has-text-weight-semibold">Propose a Bill</span>
    </a>
  `
}
