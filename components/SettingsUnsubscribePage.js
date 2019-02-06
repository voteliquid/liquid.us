const { api, html } = require('../helpers')

module.exports = {
  init: ({ location }) => [{
    error: null,
    query: {
      list: location.query.list,
      id: location.query.id,
    },
  }, initialize(location.query.id, location.query.list)],
  update: (event, state) => {
    switch (event.type) {
      case 'unsubscribed':
        return [{ ...state, unsubscribed: true }]
      case 'error':
        return [{ ...state, error: event.error }]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: ({ error }) => {
    return html()`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <div class="content">
              <p class="title is-4">
                ${error
                  ? 'There was a problem saving your unsubscribe request.'
                  : `You have successfully unsubscribed.`
                }
              </p>
              <p>
                <a href="/settings">Manage your notifications settings</a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    `
  },
}

const initialize = (user_id, list) => (dispatch) => {
  api('/unsubscribes', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ user_id, list }),
  })
  .catch((error) => {
    console.log(error)
    if (error && error.message && !error.message.includes('duplicate')) {
      dispatch({ type: 'error', error })
    }
  })
  .then(() => {
    dispatch({ type: 'loaded' })
  })
}
