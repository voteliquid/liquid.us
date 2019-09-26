const { handleForm, html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const signatureView = require('./signature')
const voteView = require('./vote')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faComment } = require('@fortawesome/free-solid-svg-icons/faComment')
const { faPlus } = require('@fortawesome/free-solid-svg-icons/faPlus')

module.exports = (state, dispatch) => {
  const { displayFilters = true, loading, location, measures, votes } = state
  const measure = measures[location.params.shortId]
  const comments = (measure.comments || []).map((id) => votes[id])
  return html`
    <div>
      ${displayFilters ? filtersView(state, dispatch) : html``}
      ${loading.comments ? activityIndicator() : html``}
      ${!loading.comments && comments.length ? comments.map(voteOrSignatureView(state, dispatch)) : html``}
      ${!loading.comments && !comments.length ? noCommentsView() : html``}
    </div>
  `
}

const voteOrSignatureView = (state, dispatch) => (vote) => {
  const type = vote.measure.type
  return (type === 'petition' ? signatureView : voteView)({ ...state, key: 'measure-comments', vote }, dispatch)
}

const noCommentsView = () => html`<p class="has-text-centered has-text-grey">No comments yet.</p>`

const filtersView = (state, dispatch) => {
  const { loading, location, measures } = state
  const measure = measures[location.params.shortId]
  const pagination = measure.commentsPagination || { offset: 0, limit: 25 }
  const { path, query } = location
  const { order, position } = query
  const prevOffset = Math.max(0, Number(pagination.offset) - Number(pagination.limit))
  return html`
    <form
      name="vote-filters"
      class="vote-filters"
      method="GET" action="${path}"
      style="margin-bottom: 2em;"
      onsubmit=${handleForm(dispatch, state)}
    >
      <div class="field is-horizontal">
        <div class="field-body">
          ${Number(pagination.count) > Number(pagination.limit) ? html`
            <nav class="field is-narrow has-addons">
              ${prevOffset ? html`
                <div class="control">
                  <a class="${`button ${loading.comments ? 'is-loading' : ''}`}" href="${prevPage(state)}">Previous</a>
                </div>
              ` : html``}
              <div class="control">
                <div class="button is-static">
                  ${prevOffset + 1} - ${Math.min((measure.comments || []).length, pagination.limit) + prevOffset} of ${pagination.count}
                </div>
              </div>
              ${Number(pagination.offset) < Number(pagination.count) ? html`
                <div class="control">
                  <a class="${`button ${loading.comments ? 'is-loading' : ''}`}" href="${nextPage(state)}">Next</a>
                </div>
              ` : html``}
            </nav>
          ` : html``}
          <div class="field is-narrow has-addons">
            <div class="control">
              <label for="vote_sort" class="button is-static is-small">
                Sort by
              </label>
            </div>
            <div class="control">
              <div class="select is-small">
                <select autocomplete="off" name="order" onchange=${autosubmit}>
                  <option value="most_recent" selected=${!order || order === 'most_recent'}>Most recent</option>
                  <option value="vote_power" selected=${order === 'vote_power'}>Vote power</option>
                </select>
              </div>
              <button type="submit" class="vote-filters-submit is-hidden"></button>
            </div>
          </div>
          <div class="field is-narrow has-addons">
            <div class="control">
              <label for="vote_sort" class="button is-static is-small">
                Position
              </label>
            </div>
            <div class="control">
              <div class="select is-small">
                <select autocomplete="off" name="position" onchange=${autosubmit}>
                  <option value="all" selected=${!position || position === 'all'}>All</option>
                  <option value="yea" selected=${position === 'yea'}>Yea</option>
                  <option value="nay" selected=${position === 'nay'}>Nay</option>
                </select>
              </div>
              <button type="submit" class="vote-filters-submit is-hidden"></button>
            </div>
          </div>
          <div class="field is-narrow">
            <div class="control">
              <button
                onclick=${(event) => dispatch({ type: 'measure:voteFormActivated', measure, event })}
                class="${`button is-small ${measure.showVoteForm ? 'is-hidden' : ''}`}"
              >
                <span class="icon">${icon(faComment)}</span>
                <span>Add your argument</span>
              </button>
            </div>
          </div>

          <div class="field is-narrow">
            <div class="control">
              <a href=${`${location.path}/import`} class="button is-link has-text-weight-semibold is-small">
                <span class="icon">${icon(faPlus)}</span>
                <span>Import external argument</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </form>
  `
}

const autosubmit = () => document.querySelector('.vote-filters-submit').click()

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
