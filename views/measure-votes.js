const { html } = require('../helpers')
const measureVoteForm = require('./measure-vote-form')
const voteView = require('./vote')

module.exports = (state, dispatch) => {
  const { location, measure, user, votes } = state
  const { votes: voteIds = [], showVoteForm } = measure
  const { order, path, position } = location.query

  return html`
    <div id="votes">
      <form name="vote-filters" style="margin-bottom: 2rem;" class="vote-filters" method="GET" action="${path}">
        <div class="field">
          <h4 class="title is-size-6 has-text-grey has-text-weight-semibold is-inline">
            All Responses
          </h4>
        </div>
        <div class="field is-horizontal">
          <div class="field-body">
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
                  Type
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
                <button onclick=${(event) => dispatch({ type: 'measure:voteFormActivated', measure, event })} class="${`button is-primary has-text-weight-semibold is-small ${showVoteForm ? 'is-hidden' : ''}`}">
                  <span class="icon"><i class="fa fa-edit"></i></span>
                  <span>Add your response</span>
                </button>
              </div>
            </div>
            ${user && user.is_admin ? html`
              <div class="field is-narrow">
                <div class="control">
                  <a href=${`${location.path}/import`} class="button is-link has-text-weight-semibold is-small">
                    <span class="icon"><i class="fa fa-plus-circle"></i></span>
                    <span>Import external argument</span>
                  </a>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </form>
      <div id="measure-vote-form">${showVoteForm ? measureVoteForm({ ...state, measure }, dispatch) : ''}</div>
      ${voteIds.length
        ? voteIds.map((id) => voteView({ key: 'measure-votes', measure, vote: votes[id], user }, dispatch))
        : html`<p class="notification has-background-light has-text-grey">No ${position ? `${position} ` : ''}arguments.</p>`
      }
    </div>
  `
}

const autosubmit = () => {
  document.querySelector('.vote-filters-submit').click()
}
