const { api, combineEffects, html, preventDefault, redirect } = require('../helpers')
const fetch = require('isomorphic-fetch')

module.exports = {
  init: ({ location, user, storage }) => [{
    error: null,
    location,
    user,
    storage,
  }],
  update: (event, state) => {
    switch (event.type) {
      case 'formSubmitted':
        return [state, combineEffects(preventDefault(event.event), postImportedVote(state, event.event))]
      case 'receivedError':
        return [{ ...state, error: event.error }]
      case 'redirected':
        return [state, redirect(event.url)]
      default:
        return [state]
    }
  },
  view: ({ error, user }, dispatch) => {
    return html()`
      <section class="section">
        <div class="container is-widescreen">
          <h2 class="title is-size-5">Import Vote</h2>
          ${!user || !user.is_admin ? [`<div class="notification is-danger">You do not have permission to import votes.</div>`] : ''}
          <form onsubmit=${(event) => dispatch({ type: 'formSubmitted', event })} class=${user && user.is_admin ? '' : 'is-hidden'}>
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
              <label class="label">Source URL:</label>
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

const postImportedVote = ({ location, storage }, event) => (dispatch) => {
  const { short_id, username } = location.params
  const formData = require('parse-form').parse(event.target).body
  const twitter_username = (formData.twitter_username || '').replace('@', '')
  fetch('/rpc/twitter_username_search', {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ twitter_username }),
  })
  .then(res => {
    if (res.status === 404) {
      return res.json().then(json => {
        return Promise.reject(new Error(json.message))
      })
    }
    return res.json()
  })
  .then((twitterApiResult) => {
    if (!twitterApiResult) {
      return Promise.reject(new Error('No Twitter user found'))
    }

    return api('/rpc/import_vote', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        twitter_username: twitterApiResult.twitter_username.replace(/@/g, ''),
        twitter_displayname: twitterApiResult.name,
        twitter_avatar: twitterApiResult.avatar,
        twitter_bio: twitterApiResult.description,
        short_id,
      }),
      storage,
    })
  })
  .then(() => dispatch({ type: 'redirected', url: `${username ? `/${username}/` : '/'}legislation/${short_id}` }))
  .catch((error) => dispatch({ type: 'receivedError', error }))
}
