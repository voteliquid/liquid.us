const { html } = require('../helpers')
const measureSummary = require('./measure-summary')
const measureVotes = require('./measure-votes')
const topComments = require('./measure-top-comments')
const sidebar = require('./measure-sidebar')

module.exports = (state, dispatch) => {
  const { location, measures, user, votes } = state
  const measure = measures[location.params.shortId]
  const l = measure
  const title = l.type === 'nomination' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title

  return html`
    <section class="section">
      <div class="container is-widescreen">
        ${l.published ? '' : unpublishedMsg(measure, user)}
        ${(l.vote_position && !user.verified) ? html`
          <p class="notification is-info">
            <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
            <strong>Help hold your reps accountable!</strong><br />
            Your vote has been saved, and we'll send it to your elected reps, but it won't be counted publicly until you <a href="/get_started">verify your identity</a>.
          </p>
        ` : ''}
        <div class="columns">
          <div class="column is-two-thirds-tablet is-three-quarters-desktop">
            <h2 class="title has-text-weight-normal is-4">${title}</h2>
            ${l.type !== 'nomination' ? measureSummary(measure, dispatch) : ''}
            ${topComments({ ...state, measure, yea: votes[l.topYea], nay: votes[l.topNay] }, dispatch)}
            ${measureVotes({ ...state, measure }, dispatch)}
          </div>
          <div class="${`column ${l.introduced_at ? `column is-one-third-tablet is-one-quarter-desktop` : ''}`}">
            ${sidebar({ ...state, measure }, dispatch)}
          </div>
        </div>
      </div>
    </section>
  `
}

const unpublishedMsg = (measure, user) => html`
  <div class="notification">
    <span class="icon"><i class="fa fa-exclamation-triangle"></i></span>
    ${user && measure.author_id === user.id
      ? `Your proposed legislation is unpublished. You can continue to edit it until you decide to publish.`
      : `This proposed legislation is a draft. The author may continue to make changes until it's published.`
    }
  </div>
`
