const { api, html } = require('../helpers')

module.exports = {
  init: [{
    error: null,
    query: {
      list: null,
      id: null,
    },
  }, (dispatch) => dispatch({ type: 'initialized' })],
  update: (event, state) => {
    const { query = {} } = state
    const { list, id: user_id } = query
    switch (event.type) {
      case 'initialized':
        return [state, user_id && list && postUnsubscribe(user_id, list)]
      case 'unsubscribed':
        return [{ ...state, unsubscribed: true }]
      case 'apiError':
        return [{ ...state, error: event.error }]
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

const postUnsubscribe = (user_id, list) => (dispatch) => {
  api('/unsubscribes', {
    method: 'POST',
    headers: { 'Prefer': 'return=minimal' },
    body: JSON.stringify({ user_id, list }),
  })
  .then(() => dispatch({ type: 'unsubscribed' }))
  .catch((error) => {
    console.log(error)
    if (error && error.message && !~error.message.indexOf('duplicate')) {
      dispatch({ type: 'apiError', error })
    }
  })
}
