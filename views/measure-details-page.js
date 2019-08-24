const { html } = require('../helpers')
const measureSummary = require('./measure-summary')
const measureVotes = require('./measure-votes')
const topComments = require('./measure-top-comments')
const sidebar = require('./measure-sidebar')
const petitionView = require('./petition-page')

module.exports = (state, dispatch) => {
  const { location, measures, user, votes } = state
  const measure = measures[location.params.shortId]

  if (measure.type === 'petition') {
    return petitionView(state, dispatch)
  }

  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${(measure.vote_position && !user.phone_verified) ? html`
          <p class="notification is-info">
            <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
            <strong>Help hold your reps accountable!</strong><br />
            Your vote has been saved, and we'll send it to your elected reps, but it won't be counted publicly until you <a href="/get_started">verify your identity</a>.
          </p>
        ` : ''}
        <div class="columns">
          <div class="column is-two-thirds-tablet is-three-quarters-desktop">
            <h2 class="title has-text-weight-normal is-4">${measure.title}</h2>
            ${measure.type !== 'nomination' ? measureSummary({ measure }, dispatch) : ''}
            ${topComments({ ...state, measure, yea: votes[measure.topYea], nay: votes[measure.topNay] }, dispatch)}
            ${measureVotes({ ...state, measure }, dispatch)}
          </div>
          <div class="${`column ${measure.introduced_at ? `column is-one-third-tablet is-one-quarter-desktop` : ''}`}">
            ${sidebar({ ...state, measure }, dispatch)}
          </div>
        </div>
      </div>
    </section>
  `
}
