const { html } = require('../helpers')
const stateNames = require('datasets-us-states-names-abbr')

const legislatorTitles = {
  California: ['Senator', 'Assembly'],
  'Dane County': ['Supervisor'],
}

module.exports = (state, dispatch) => {
  const { backersFilterQuery, measures, loading, location, votes } = state
  const vote = votes[location.params.voteId]

  // Prepare the row for display, so data is searchable
  const backers = vote.backers && vote.backers.map((backer, index) => ({
    index: index + 1,
    Time: new Date(backer.created_at).toLocaleString(),
    Name: backer.public ? backer.name : '[private]',
    Location: `${backer.locality || ''}${backer.locality && stateNames[backer.administrative_area_level_1] ? `, ` : ''}${stateNames[backer.administrative_area_level_1] || ''}`,
    reps: backer.offices.map(office => {
      if (!office) { return '' }
      const { office_holder } = office
      if (!office_holder) { return '' }
      return `${office_holder.first_name} ${office_holder.last_name} (D-${last(office.name.split(' '))})`
    }),
    Comment: backer.comment,
  }))

  const filteredBackers = !backersFilterQuery
    ? backers
    : backers && backers.filter(backer => Object.keys(backer).some((key) => String(backer[key]).toLowerCase().includes(String(backersFilterQuery).toLowerCase())))

  const measure = measures[location.params.shortId]
  const numLegislators = backers && backers.reduce((max, backer) => Math.max(max, backer.reps.length), 0)
  const titles = legislatorTitles[measure.legislature_name] || []

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
                ${Array.from(Array(numLegislators)).map((a, idx) => html`<th>${titles[idx] || `Legislator ${idx + 1}`}</th>`)}
                <th>Comment</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBackers.map((b) => backersTableRow(b, numLegislators))}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `
}

const last = (array) => array[array.length - 1]

const backersTableRow = (backer, numLegislators) => {
  return html`
    <tr>
      <td><span style="width: 30px; display: inline-block; text-align: right;">${backer.index}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Time}</span></td>
      <td><span style="width: 165px; display: inline-block;">${backer.Name}</span></td>
      <td><span style="width: 145px; display: inline-block;">${backer.Location}</span></td>
      ${Array.from(Array(numLegislators)).map((a, idx) => html`
        <td><span style="width: 165px; display: inline-block;">${backer.reps[idx]}</span></td>
      `)}
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
