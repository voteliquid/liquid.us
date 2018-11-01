const { api, combineEffects, html, preventDefault } = require('../helpers')

module.exports = {
  init: [{
    error: null,
    params: {
      short_id: null,
    },
    user: null,
    storage: null,
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'formSubmitted':
        return [state, combineEffects(preventDefault(event.event), postImportedVote(state, event.event))]
      case 'receivedError':
        return [{ ...state, error: event.error }]
      case 'voteImported':
      default:
        return [state]
    }
  },
  view: ({ error, user }, dispatch) => {
    return html()`
      <section class="section">
        <div class="container is-widescreen">
          <h2 class="title is-size-5">Import Vote</h2>
          ${!user.is_admin ? [`<div class="notification is-danger">You do not have permission to import votes.</div>`] : ''}
          <form onsubmit=${(event) => dispatch({ type: 'formSubmitted', event })} class=${user.is_admin ? '' : 'is-hidden'}>
            ${error ? [`<div class="notification is-danger">${error.message}</div>`] : ''}
            <div class="field">
              <label class="label">Position:</label>
              <div class="control">
                <label class="radio">
                  <input type="radio" name="vote_position" value="yea" />
                  Yea
                </label>
                <label class="radio">
                  <input type="radio" name="vote_position" value="nay" />
                  Nay
                </label>
                <label class="radio">
                  <input type="radio" name="vote_position" value="abstain" />
                  Undecided
                </label>
              </div>
            </div>
            <div class="field">
              <label class="label">Twitter Username:</label>
              <div class="control">
                <input name="twitter_username" required class="input" />
              </div>
            </div>
            <div class="field">
              <label class="label">Tweet URL:</label>
              <div class="control">
                <input name="source_url" required class="input" />
              </div>
            </div>
            <div class="field">
              <label class="label">Date:</label>
              <div class="control">
                <input name="created_at" required class="input" />
              </div>
            </div>
            <div class="field">
              <label class="label">Comment:</label>
              <div class="control">
                <textarea required name="comment" autocomplete="off" class="textarea"></textarea>
              </div>
            </div>
            <div class="field">
              <div class="control">
                <button class="button is-primary" type="submit">Import</button>
              </div>
            </div>
          </form>
        </div>
      </section>
    `
  },
}

const postImportedVote = ({ params, storage }, event) => (dispatch) => {
  const { short_id } = params
  const formData = require('parse-form').parse(event.target).body
  const twitter_username = (formData.twitter_username || '').replace('@', '')
  api('/rpc/import_vote', {
    method: 'POST',
    body: JSON.stringify({ ...formData, twitter_username, short_id }),
    storage,
  })
  .then(() => dispatch({ type: 'importedVote' }))
  .catch((error) => dispatch({ type: 'receivedError', error }))
}
