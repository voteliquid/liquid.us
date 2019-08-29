const { handleForm, html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const stateNames = require('datasets-us-states-names-abbr')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faTable } = require('@fortawesome/free-solid-svg-icons/faTable')

module.exports = (state, dispatch) => {
  const { displayPosition = true, measures, loading, location } = state
  const measure = measures[location.params.shortId]
  const votes = (measure.votes || []).map((id) => state.votes[id]).map((vote) => {
    return {
      ...vote,
      name: vote.public ? `${vote.user.first_name} ${vote.user.last_name}` : '[private]',
      created_at: new Date(vote.created_at).toLocaleString(),
      location: `${vote.locality || ''}${vote.locality && stateNames[vote.administrative_area_level_1] ? `, ` : ''}${stateNames[vote.administrative_area_level_1] || ''}`,
    }
  })
  const colspan = displayPosition ? 7 : 6

  return html`
    <div>
      ${filterView(state, dispatch)}
      <table class="table is-fullwidth is-striped">
        <thead>
          <tr>
            <th>Id</th>
            ${displayPosition ? html`<th>Position</th>` : html``}
            <th>Name</th>
            <th>Location</th>
            <th>District</th>
            <th>Voter Registration</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody class="is-size-7">
          ${loading.votes ? html`<tr><td class="has-text-centered" colspan="${colspan}">${activityIndicator()}</td></tr>` : html``}
          ${!loading.votes && !votes.length ? html`<tr><td class="has-text-centered" colspan="${colspan}">No votes yet.</td></tr>` : html``}
          ${!loading.votes && votes.length ? votes.map((b) => voteTableRow(b, { displayPosition })) : html``}
        </tbody>
      </table>
    </div>
  `
}

const voteTableRow = (vote, { displayPosition = true }) => {
  const district = vote.offices.filter(({ chamber }) => chamber === 'Lower').map(({ short_name }) => short_name)[0]
  return html`
    <tr>
      <td>${vote.id}</td>
      ${displayPosition ? html`<td>${vote.position}</td>` : html``}
      <td>${vote.name}</td>
      <td>${vote.location}</td>
      <td>${district}</td>
      <td>${vote.voter_verified ? 'Verified' : 'Unverified'}</td>
      <td>${vote.created_at}</td>
    </tr>
  `
}

const filterView = (state, dispatch) => {
  const { loading, location, measures } = state
  const measure = measures[location.params.shortId]
  const pagination = measure.votesPagination || { offset: 0, limit: 50 }
  const prevOffset = Math.max(0, Number(pagination.offset) - Number(pagination.limit))
  return html`
    <div style="margin-bottom: 2em;">
      <div class="field is-horizontal">
        <div class="field-body">
          <form class="field" method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:voteCSVRequested', measure })}>
            <div class="control">
              <button type="submit" disabled=${loading.voteReport} class="${`button ${loading.voteReport ? 'is-loading' : ''}`}">
                <span class="icon is-small">${icon(faTable)}</span>
                <span>Download CSV</span>
              </button>
            </div>
          </form>
          ${Number(pagination.count) > Number(pagination.limit) ? html`
            <nav class="field is-narrow has-addons">
              ${prevOffset ? html`
                <div class="control">
                  <a class="${`button ${loading.votes ? 'is-loading' : ''}`}" href="${prevPage(state)}">Previous</a>
                </div>
              ` : html``}
              <div class="control">
                <div class="button is-static">
                  ${prevOffset + 1} - ${Math.min((measure.votes || []).length, pagination.limit) + prevOffset} of ${pagination.count}
                </div>
              </div>
              ${Number(pagination.offset) < Number(pagination.count) ? html`
                <div class="control">
                  <a class="${`button ${loading.votes ? 'is-loading' : ''}`}" href="${nextPage(state)}">Next</a>
                </div>
              ` : html``}
            </nav>
          ` : html``}
        </div>
      </div>
    </form>
  `
}

const prevPage = ({ location, measures }) => {
  const measure = measures[location.params.shortId]
  const pagination = measure.commentsPagination || { offset: 0, limit: 50 }
  const query = {
    ...location.query,
    limit: pagination.limit,
    offset: Math.max(0, Number(pagination.offset) - Number(pagination.limit)),
  }
  return `${location.path}?${Object.keys(query).map((key) => `${key}=${query[key]}`).join('&')}`
}

const nextPage = ({ location, measures }) => {
  const measure = measures[location.params.shortId]
  const pagination = measure.commentsPagination || { offset: 0, limit: 50 }
  const query = {
    ...location.query,
    limit: pagination.limit,
    offset: Number(pagination.offset) + Number(pagination.limit),
  }
  return `${location.path}?${Object.keys(query).map((key) => `${key}=${query[key]}`).join('&')}`
}
