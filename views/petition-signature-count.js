const { html } = require('../helpers')
const milestones = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]

module.exports = ({ vote, yeas_direct: yeas }) => {
  return html`
    <div>
      <p>
        <span class="has-text-weight-bold">${yeas} signature${yeas === 1 ? '' : 's'}</span>${vote && vote.position ? `, including yours.` : '.'}
        Let's get to ${nextMilestone(yeas)}!
      </p>
      <progress class="progress is-success" style="margin-top: 0.5rem; margin-bottom: 1.5rem" value=${yeas} max=${nextMilestone(yeas)}>15%</progress>
    </div>
  `
}

const nextMilestone = (current) => milestones.filter(ms => ms > current)[0]
