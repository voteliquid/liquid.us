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
            <th>Time (pt)</th>
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
      <td><span style="width: 30px; display: inline-block; text-align: right;">${index + 1}</span></td>
      <td><span style="width: 175px; display: inline-block;">${backer['Time (pt)']}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Name}</span></td>
      <td><span style="width: 145px; display: inline-block;">${backer.City}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Senator}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Assembly}</span></td>
      <td>${backer.Comment}</td>
    </tr>
  `
}
