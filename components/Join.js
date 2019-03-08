const { api, html, mapEffect, mapEvent, redirect } = require('../helpers')
const JoinForm = require('./JoinForm')
const atob = require('atob')

module.exports = {
  init: ({ location, storage, user }) => [{
    joinForm: JoinForm.init({ location, storage, user })[0],
    location,
    storage,
    user,
  }, initialize(location, storage, user)],
  update: (event, state) => {
    switch (event.type) {
      case 'joinFormEvent':
        const [joinFormState, joinFormEffect] = JoinForm.update(event.event, state.joinForm)
        if (event.event.type === 'userUpdated' || event.event.type === 'loaded' || event.event.type === 'redirected') {
          return [state, (dispatch) => dispatch(event.event)]
        }
        return [{ ...state, joinForm: joinFormState }, mapEffect('joinFormEvent', joinFormEffect)]
      case 'redirected':
        return [state, redirect(event.url, event.status)]
      case 'loaded':
      default:
        return [state]
    }
  },
  view: (state, dispatch) => {
    return html()`
      <div>
        <section class="section">
          <div class="container">
            ${JoinForm.view(state.joinForm, mapEvent('joinFormEvent', dispatch))}
          </div>
        </section>
        <div class="hero">
          <div class="hero-body">
            <h3 class="subtitle is-4 has-text-centered">Sign up in less than 5 minutes:</h3>
            <div class="container is-centered"><div class="columns">
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9312;</span><br /><br />
                  <i class="fa fa-users" aria-hidden="true"></i>
                  Proxying
                </a></h4>
                <p>Choose optional personal representatives so your values will always be counted.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9313;</span><br /><br />
                  <i class="far fa-address-card" aria-hidden="true"></i>
                  Verification
                </h4>
                <p>Confirm your identity to ensure 1-person-1-vote.</p>
              </div>
              <div class="column has-text-centered">
                <h4 class="title is-4">
                  <span class="has-text-grey-light">&#9314;</span><br /><br />
                  <i class="far fa-check-square" aria-hidden="true"></i>
                  Legislation
                </h4>
                <p>Vote directly on bills to hold your elected reps accountable.</p>
              </div>
            </div></div>
          </div>
        </div>
      </div>
    `
  },
}

const initialize = (location, storage, user) => (dispatch) => {
  if (user) {
    if (location.query.ph) {
      // If they followed an SMS signup link, update their account to include their phone number
      return api(`/users?id=eq.${user.id}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ phone_number: atob(location.query.ph) }),
        storage,
      })
      .then(() => dispatch({ type: 'redirected', url: '/' }))
    }

    return dispatch({ type: 'redirected', url: '/' })
  }

  return JoinForm.init({ location, storage, user })[1](mapEvent('joinFormEvent', dispatch))
}
