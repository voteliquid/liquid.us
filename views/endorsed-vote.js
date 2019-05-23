const { html } = require('../helpers')
const voteView = require('./vote')

module.exports = (state, dispatch) => {
  const { vote, user } = state
  const isOwnVote = user && user.id === vote.user_id
  const endorsed_vote = !(isOwnVote && vote.comment) && vote.endorsed_vote
  const { endorsement_public } = endorsed_vote || vote
  return html`
    <div>
    ${endorsed_vote ? html`<p class="is-size-7 has-text-grey" style="margin-bottom: 1em;">Backed by <a href="${`/${vote.username}`}">${vote.fullname}</a>${(isOwnVote && endorsement_public) || vote.public ? '' : ' privately'}:</p>` : ''}
    ${voteView({ ...state, showBill: true, vote: endorsed_vote || vote }, dispatch)}
    </div>
  `
}
