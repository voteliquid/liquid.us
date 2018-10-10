const { html } = require('../helpers')
const AddressForm = require('./AddressForm')

module.exports = {
  init: [{
    error: null,
    user: null,
    storage: null,
  }],
  update: (event, state) => {
    return AddressForm.update(event, state)
  },
  view: (state, dispatch) => {
    return html()`
      <section class="section">
        <div class="columns is-centered">
          <div class="column is-half">
            <h2 class="subtitle">Change your address.</h2>
            ${AddressForm.view(state, dispatch)}
          </div>
        </div>
      </section>
    `
  },
}
