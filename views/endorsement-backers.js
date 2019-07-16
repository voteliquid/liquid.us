const { html } = require('../helpers')

module.exports = (state) => {
  const { location, votes, loading } = state
  const vote = votes[location.params.voteId]
  const backers = vote.backers

  return html`
    ${loading.backers ? html`
      <h3>Loading backers...</h3>
    ` : html`
      <table class="table is-narrow is-bordered is-striped" style="display: block; overflow-x: auto; max-width: 858px; border-right: 1px solid #e6e6e6">
        <thead>
          <tr>
            <th></th>
            <th>Time(pt)</th>
            <th>Name</th>
            <th>Location</th>
            <th>Senator</th>
            <th>Assembly</th>
            <th>Comment</th>
          </tr>
        </thead>
        <tbody>
          ${backers.length
            ? backers.map((backer, index) => latestVotesTableRow({ backer, index }))
            : html`<tr><td colspan="9">No backers to display.</td></tr>`
          }
        </tbody>
      </table>
    `}
  `
}

const latestVotesTableRow = ({ backer, index }) => {
  return html`
    <tr>
      <td>${index + 1}</td>
      <td>${backer['Time (pt)']}</td>
      <td>${backer.Name}</td>
      <td>${backer.City}</td>
      <td>${backer.Senator}</td>
      <td>${backer.Assembly}</td>
      <td>${backer.Comment}</td>
    </tr>
  `
}
