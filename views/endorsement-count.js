const { html } = require('../helpers')
const milestones = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]

module.exports = (vote) => {
  const { all_proxy_vote_count, position } = vote
  const count = all_proxy_vote_count

  let action = 'endorsed'; let color = 'is-success'
  if (position === 'nay') { action = 'opposed'; color = 'is-danger' }
  if (position === 'abstain') { action = 'weighed in'; color = 'is-success' }

  return html`
    <div>
      <p><span class="has-text-weight-bold">${count} ${count === 1 ? 'has' : 'have'} ${action}.</span> Let's get to ${nextMilestone(count)}!</p>
      <progress class=${`progress ${color}`} style="margin-top: 0.5rem; margin-bottom: 1.5rem" value=${count} max=${nextMilestone(count)}>15%</progress>
    </div>
  `
}

const nextMilestone = (current) => milestones.filter(ms => ms > current)[0]
