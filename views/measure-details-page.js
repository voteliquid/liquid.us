const { html } = require('../helpers')
const measureSummary = require('./measure-summary')
const measureVoteForm = require('./measure-vote-form')
const commentsView = require('./measure-comments')
const voteView = require('./vote')
const votesView = require('./measure-votes')
const topComments = require('./measure-top-comments')
const sidebar = require('./measure-sidebar')
const petitionView = require('./petition-page')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')
const updatesView = require('./measure-updates')

module.exports = (state, dispatch) => {
  const { location, measures, user, votes } = state
  const measure = measures[location.params.shortId]
  const vote = votes[location.params.voteId]
  const { showVoteForm } = measure
  const tab = location.query.tab || 'comments'
  const commentCount = measure.commentsPagination ? measure.commentsPagination.count : 0
  const voteCount = measure.yeas + measure.nays + measure.abstains

  if (measure.type === 'petition') {
    return petitionView(state, dispatch)
  }

  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title has-text-weight-normal has-text-centered has-text-left-mobile is-4">${measure.title}</h2>
        ${(measure.vote && !user.phone_verified) ? html`
          <p class="notification is-info">
            <span class="icon">${icon(faExclamationTriangle)}</span>
            <strong>Help hold your reps accountable!</strong><br />
            Your vote has been saved, and we'll send it to your elected reps, but it won't be counted publicly until you <a href="/get_started">verify your identity</a>.
          </p>
        ` : ''}
        <div class="columns">
          <div class="column is-two-thirds-tablet is-three-quarters-desktop">
            ${vote && vote.comment ? voteDetailView({ ...state, vote }, dispatch) : html``}
            ${(!vote || !vote.comment) && measure.type !== 'nomination' && measure.summary && measure.summary.trim() ? measureSummary({ measure }, dispatch) : ''}
            ${measure.fulltext ? html`
              <div style="border: 1px solid hsl(0, 0%, 85%); padding: 1.2rem; height: 300px; overflow-y: scroll; box-shadow: inset hsl(0, 0%, 92%) 3px 3px 3px 0px; margin-bottom: 2rem;">
                ${measure.fulltext}
              </div>
            ` : ''}
            ${topComments({ ...state, measure, yea: votes[measure.topYea], nay: votes[measure.topNay] }, dispatch)}
            <div id="votes">
              <div id="measure-vote-form">${showVoteForm ? measureVoteForm({ ...state, measure }, dispatch) : ''}</div>
              <div class="tabs is-centered is-boxed">
                <ul>
                  <li class=${tab === 'comments' ? 'is-active' : ''}>
                    <a href=${location.path}>Arguments${commentCount ? ` (${commentCount})` : ''}</a>
                  </li>
                  <li class="${tab === 'updates' ? 'is-active' : ''}">
                    <a href=${`${location.path}?tab=updates`}>Updates</a>
                  </li>
                  <li class=${tab === 'votes' ? 'is-active' : ''}>
                    <a href=${`${location.path}?tab=votes`}>Votes${voteCount ? ` (${voteCount})` : ''}</a>
                  </li>
                </ul>
              </div>
              ${tab === 'votes'
                ? votesView({ ...state, displayPosition: true }, dispatch)
                : tab === 'updates'
                ? updatesView(state, dispatch)
                : commentsView(state, dispatch)}
            </div>
          </div>
          <div class="${`column ${measure.introduced_at ? `column is-one-third-tablet is-one-quarter-desktop` : ''}`}">
            ${sidebar({ ...state, measure }, dispatch)}
          </div>
        </div>
      </div>
    </section>
  `
}

const voteDetailView = (state, dispatch) => {
  return html`
    <div class="box is-size-5">
      ${voteView({ ...state, padded: false }, dispatch)}
    </div>
  `
}
