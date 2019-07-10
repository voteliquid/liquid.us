const { html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { location } = state
  const { order } = location.query

  const autosubmit = () => {
    document.querySelector('.question-filters-submit').click()
  }
    return html`
    <div class="columns is-mobile">
      <div class="column is-narrow">
        <div class="field is-narrow has-addons">
          <div class="control">
            <label for="question_sort" class="button is-static is-small">
              Sort by
            </label>
          </div>
          <div class="control">
            <div class="select is-small">
              <select autocomplete="off" name="order" onchange=${autosubmit}>
                <option value="most_recent" selected=${!order || order === 'most_recent'}>Most recent</option>
                <option value="most_support" selected=${order === 'most_support'}>Most support</option>
              </select>
            </div>
            <button type="submit" class="question-filters-submit is-hidden"></button>
          </div>
        </div>
      </div>
      <div class="column"
        <div class="field is-narrow">
          <div class="control">
            <button class="button is-primary has-text-weight-semibold is-small">
              <span class="icon"><i class="fa fa-edit"></i></span>
              <span>Add question</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <div>${questionForm(dispatch, state)}</div>
  `
}

const questionForm = (dispatch, state) => {
  const { error, location, user } = state

    return html`
    <form method="POST" style="margin-bottom: 2rem;" onconnected=${scrollToForm(location)}>
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
            <div class="field join-input-field">
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
            <input name="is_public" type="checkbox" checked=${user ? user.last_vote_public : true} />
            Share my name publicly
          </label>
        </div>
      </div>
      <div class="field is-horizontal">
        <div class="field is-grouped">
          <div class="control">
            <button class="button" type="submit">
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
