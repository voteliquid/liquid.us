const { api, combineEffects, html, preventDefault, redirect } = require('../helpers')
const ActivityIndicator = require('./ActivityIndicator')

module.exports = {
  init: ({ storage, user }) => [{
    loaded: false,
    updateChecked: user && user.update_emails_preference !== 'never',
    user,
    storage,
  }, initialize(user, storage)],
  update: (event, state) => {
    const { storage, user } = state
    switch (event.type) {
      case 'changed':
        const selected = event.event.target.value
        const saved = user.update_emails_preference
        return [{ ...state, settings_unsaved: selected !== saved }]
      case 'clicked':
        return [{ ...state, updateChecked: !state.updateChecked }]
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      case 'submitted':
        const formData = require('parse-form').parse(event.event.target).body

        return [{
          ...state,
          user: {
            ...state.user,
            inherit_votes: formData.inherit_votes === 'true',
            update_emails_preference: !formData.subscribeUpdates ? 'never' : formData.update_emails_preference,
          },
          settings_unsaved: false,
        }, combineEffects(preventDefault(event.event), patchUserPrefs(formData, user, storage))]
      case 'unsubsReceived':
        return [{
          ...state,
          loaded: true,
          unsubscribed_drip: event.unsubs.some(({ list }) => list === 'drip'),
          unsubscribed_lifecycle: event.unsubs.some(({ list }) => list === 'lifecycle'),
        }]
      case 'userUpdated':
        return [{ ...state, user: event.user }]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: ({ loaded, settings_unsaved, unsubscribed_drip, unsubscribed_lifecycle, updateChecked, user }, dispatch) => {
    return html()`
      <section class="section">
        <div class="container is-widescreen">
          <h2 class="title is-5">Settings</h2>
          ${loaded ? '' : ActivityIndicator()}
          <form class="${loaded ? '' : 'is-hidden'}" method="POST" onsubmit=${(event) => dispatch({ type: 'submitted', event })} onchange=${(event) => dispatch({ type: 'changed', event })}>
            <div class="field">
              <h3 class="title is-6 is-marginless">Notifications</h3>
            </div>
            <div class="field">
              <div class="control">
                <label class="checkbox">
                  <input name="subscribeDrip" type="checkbox" checked=${!unsubscribed_drip} />
                  Send me educational emails about Liquid Democracy
                </label>
              </div>
              <div class="control">
                <label class="checkbox">
                  <input name="subscribeLifecycle" type="checkbox" checked=${!unsubscribed_lifecycle} />
                  Send me reminder emails about things I've missed
                </label>
              </div>
              <div class="control">
                <label class="checkbox">
                  <input type="checkbox" name="subscribeUpdates" checked=${updateChecked} onclick=${(event) => dispatch({ type: 'clicked', event })} />
                  Send me update emails about what my reps have been voting on
                </label>
              </div>
            </div>
            <div class="${`field ${updateChecked ? '' : 'is-hidden'}`}" style="margin-left: 2rem;">
              <p>
                How often?
              </p>
              <div class="field">
                <div class="control">
                  <label class="radio">
                    <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'daily'} value="daily">
                    Daily
                  </label>
                  <label class="radio">
                    <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'weekly' || user.update_emails_preference === 'never'} value="weekly">
                    Weekly
                  </label>
                  <label class="radio">
                    <input type="radio" name="update_emails_preference" checked=${user.update_emails_preference === 'monthly'} value="monthly">
                    Monthly
                  </label>
                </div>
              </div>
            </div>
            <div class="field">
              <h3 class="title is-6 is-marginless">Privacy</h3>
            </div>
            <div class="field">
              <label for="inherit_votes">Votes inherited by proxies should default to:</label>
              <div class="control">
                <div class="select is-small">
                  <select name="inherit_votes">
                    <option value="true" selected=${user.inherit_votes}>Public (Vote Power: ${user.max_vote_power || 1})</option>
                    <option value="false" selected=${!user.inherit_votes}>Private (Vote Power: 1)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <div class="control">
                ${settings_unsaved
                  ? [`<button class="button is-primary" type="submit">Save</button>`]
                  : [`<button class="button is-primary" type="submit" disabled>Saved</button>`]
                }
              </div>
            </div>
          </form>
        </div>
      </section>
    `
  },
}

const initialize = (user, storage) => (dispatch) => {
  if (user) {
    api(`/unsubscribes?user_id=eq.${user.id}`, { storage }).then((unsubs) => {
      api('/rpc/max_vote_power', {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id, since: new Date('1970').toISOString() }),
        storage,
      }).then((max_vote_power) => {
        user.max_vote_power = max_vote_power || 1
        dispatch({ type: 'userUpdated', user })
        dispatch({ type: 'unsubsReceived', unsubs })
        dispatch({ type: 'loaded' })
      })
    })
  } else {
    dispatch({ type: 'redirected', url: '/sign_in', status: 403 })
  }
}

const patchUserPrefs = (formData, user, storage) => () => {
  const { inherit_votes, subscribeUpdates, subscribeDrip, subscribeLifecycle, update_emails_preference } = formData
  return api(`/users?select=id&id=eq.${user.id}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      update_emails_preference: !subscribeUpdates ? 'never' : update_emails_preference,
      inherit_votes: inherit_votes === 'true',
    }),
    storage,
  })
  .then(() =>
    (subscribeDrip ? deleteUnsubscribe(user.id, 'drip', storage) : postUnsubscribe(user.id, 'drip', storage)))
  .then(() =>
    (subscribeLifecycle ? deleteUnsubscribe(user.id, 'lifecycle', storage) : postUnsubscribe(user.id, 'lifecycle', storage)))
}

const deleteUnsubscribe = (user_id, list, storage) => {
  return api(`/unsubscribes?user_id=eq.${user_id}&list=eq.${list}`, {
    method: 'DELETE',
    headers: {
      Prefer: 'return=minimal',
    },
    storage,
  })
}

const postUnsubscribe = (user_id, list, storage) => {
  return api(`/unsubscribes?user_id=eq.${user_id}&list=eq.${list}`, {
    method: 'POST',
    headers: {
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      user_id,
      list,
    }),
    storage,
  })
}
