const { html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { backersFilterQuery, location, votes, loading } = state
  const vote = votes[location.params.voteId]
  const backers = vote.backers
  const filteredBackers = backers && backers.reduce((memo, backer, index) => (
    passesFilter({ ...backer, index: index + 1 }, backersFilterQuery)
      ? memo.concat({ ...backer, index: index + 1 })
      : memo
  ), [])

  return html`
    ${loading.backers || !filteredBackers ? html`
      <h3>Loading backers...</h3>
    ` : html`
      ${searchBar(dispatch, { backers, backersFilterQuery, filteredBackers })}
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
          ${filteredBackers.map((b) => backersTableRow(b))}
        </tbody>
      </table>
    `}
  `
}

const backersTableRow = (backer) => {
  return html`
    <tr>
      <td><span style="width: 30px; display: inline-block; text-align: right;">${backer.index}</span></td>
      <td><span style="width: 175px; display: inline-block;">${backer['Time (pt)']}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Name}</span></td>
      <td><span style="width: 145px; display: inline-block;">${backer.City}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Senator}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Assembly}</span></td>
      <td><span style="width: 398px; display: inline-block;">${backer.Comment}</span></td>
    </tr>
  `
}

const searchBar = (dispatch, { backers, backersFilterQuery, filteredBackers }) => {
  return html`
    <div class="search" style="position: relative; width: 100%;">
      <div class="field">
        <div class="${`control has-icons-left is-expanded`}">
          <input
            onkeyup=${(event) => dispatch({ type: 'vote:backersFilterUpdated', event })}
            class="input" placeholder="Filter table by any column: Name, Location, Comment, etc" value=${backersFilterQuery || ''} />
          <span class="icon is-left">
            <i class="fa fa-search"></i>
          </span>
        </div>
        ${filteredBackers.length < backers.length
          ? html`<span class="tag is-light" style="position: absolute; right: 5px; top: 6px">${filteredBackers.length} results</span>`
          : []}
      </div>
    </div>
    <br />
  `
}

function passesFilter(backer, backersFilterQuery) {
  return !backersFilterQuery || Object.keys(backer).some((key) => String(backer[key]).toLowerCase().includes(String(backersFilterQuery).toLowerCase()))
}
