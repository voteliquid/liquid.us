const { html } = require('../helpers')
const milestones = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]

module.exports = ({ vote, voteCounts = [] }) => {
  const count = voteCounts[0] && voteCounts[0].yeas

  return html`
    <div>
      <p>
        <span class="has-text-weight-bold">${count} signature${count === 1 ? '' : 's'}</span>${vote && vote.position ? `, including yours.` : '.'}
        Let's get to ${nextMilestone(count)}!
      </p>
      <progress class="progress is-success" style="margin-top: 0.5rem; margin-bottom: 1.5rem" value=${count} max=${nextMilestone(count)}>15%</progress>
    </div>
  `
}

const nextMilestone = (current) => milestones.filter(ms => ms > current)[0]
