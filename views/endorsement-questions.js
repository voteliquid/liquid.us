const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { error, loading, location, measure: l, user } = state

  return html`
    <form method="POST" style="margin-bottom: 2rem;" onsubmit=${handleForm(dispatch, { type: 'vote:voted', measure: l })} onconnected=${scrollToForm(location)}>
      <div class="field">
        <h4 class="title is-size-6">Add question</h4>
      </div>
      ${error ? html`<div class="notification is-danger">${error}</div>` : ''}
      <div class="${user ? 'columns is-hidden' : 'columns'}">
        <div class="column">
          <div class="field">
            <label class="label has-text-grey">Your Name *</label>
            <div class="control has-icons-right">
              <input name="name" class="input" type="text" placeholder="John Doe" />
              <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label has-text-grey">Your Email *</label>
            <div class="field has-addons join-input-field">
              <div class="control has-icons-right">
                <input name="email" class="input" type="text" placeholder="you@example.com" />
                <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="${user ? 'field is-hidden' : 'field'}">
        <label class="label has-text-grey">Your Address</label>
        <div class="control has-icons-right">
          <input onconnected=${initGoogleMaps} id="address_autocomplete_sidebar" class="input" autocomplete="off" name="address" placeholder="185 Berry Street, San Francisco, CA 94121" />
          <span class="icon is-small is-right"><i class="fa fa-lock"></i></span>
        </div>
        <p class="is-size-7" style="margin-top: .3rem;">So we can connect you to your reps and fellow constituents.</p>
      </div>
      <div class="field">
        <div class="control">
          <textarea name="comment" autocomplete="off" class="textarea" placeholder="Add your question. What do you want to know?"></textarea>
        </div>
      </div>
      <div class="field">
        <div class="control">
          <label class="checkbox">
            <input name="is_public" type="checkbox" checked=${user.last_vote_public} />
            Share my name publicly
          </label>
        </div>
      </div>
      <div class="field is-horizontal">
        <div class="field is-grouped">
          <div class="control">
            <button class=${`button ${loading.vote ? 'is-loading' : ''}`} disabled=${loading.vote} type="submit">
              <span class="icon"><i class="fa fa-edit"></i></span>
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>
      <hr />
    </form>
  `
}

const scrollToForm = (location) => {
  if (location.query.action === 'add-argument') {
    window.scrollTo(0, document.getElementById('measure-vote-form').getBoundingClientRect().top)
  }
}
const initGoogleMaps = (event) => window.initGoogleAddressAutocomplete(event.currentTarget.getAttribute('id'))
