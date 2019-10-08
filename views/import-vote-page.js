const { handleForm, html } = require('../helpers')
const authorForm = require('./import-author-form')

module.exports = (state, dispatch) => {
  const { cookies, error, location, measures, user } = state
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-size-5">Import External Opinion Related to <a href=${location.path.slice(0, -7)}>${cookies.measure_short_id === location.params.shortId ? cookies.measure_title : location.params.shortId}</a></h2>

        ${!user ? html`<div class="notification is-danger">Login to import comments.</div>` : html`<div class="is-size-5"><p>Once imported & approved, it will be displayed alongside other comments.</p><br /></div>`}

        <form onsubmit=${handleForm(dispatch, { type: 'import:voteImportFormSubmitted', short_id: location.params.shortId })} class=${user ? '' : 'is-hidden'}>

          ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}
          <div class="field">
            <label class="label">Add author:</label>
            ${authorForm(state, dispatch)}
          </div>
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
            <label class="label">Source URL:</label>
            <div class="control">
              <input name="source_url" required class="input" placeholder="https://" />
            </div>
          </div>
          <div class="field">
            <label class="label">Date:</label>
            <div class="control">
              <input name="created_at" required class="input" placeholder="May 20, 2019" />
            </div>
          </div>
          <div class="field">
            <label class="label">Comment:</label>
            <div class="control">
              <textarea required name="comment" autocomplete="off" class="textarea" placeholder="Copy an excerpt from the opinion."></textarea>
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
}
