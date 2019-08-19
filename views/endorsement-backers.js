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
    <div>
      ${loading.backers || !filteredBackers ? html`
        <h3>Loading backers...</h3>
      ` : html`
        <div>
          ${searchBar(dispatch, { backers, backersFilterQuery, filteredBackers })}
          <table class="table is-narrow is-bordered is-striped" style="display: block; overflow-x: auto; max-width: 858px; border-right: 1px solid #e6e6e6">
            <thead>
              <tr>
                <th></th>
                <th>Time</th>
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
        </div>
      `}
    </div>
  `
}

const last = (array) => array[array.length - 1]

const backersTableRow = (backer) => {
  let rep1_display = ''
  const rep1 = backer.offices[0]
  if (rep1) {
    rep1_display = `${rep1.office_holder.first_name} ${rep1.office_holder.last_name} (D-${last(rep1.name.split(' '))})`
  }
  let rep2_display = ''
  const rep2 = backer.offices[1]
  if (rep2) {
    rep2_display = `${rep2.office_holder.first_name} ${rep2.office_holder.last_name} (D-${last(rep2.name.split(' '))})`
  }
  const name = backer.public ? backer.name : '[private]'

  return html`
    <tr>
      <td><span style="width: 30px; display: inline-block; text-align: right;">${backer.index}</span></td>
      <td><span style="width: 175px; display: inline-block;">${new Date(backer.created_at).toLocaleString()}</span></td>
      <td><span style="width: 165px; display: inline-block;">${name}</span></td>
      <td><span style="width: 145px; display: inline-block;">${backer.locality}</span></td>
      <td><span style="width: 165px; display: inline-block;">${rep1_display}</span></td>
      <td><span style="width: 165px; display: inline-block;">${rep2_display}</span></td>
      <td><span style="width: 398px; display: inline-block;">${backer.comment}</span></td>
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
