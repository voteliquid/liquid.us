const { handleForm, html } = require('../helpers')

module.exports = ({ error, location, user }, dispatch) => {
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-size-5">Import Argument to <a href=${location.path.slice(0, -7)}>${location.params.shortId}</a></h2>

        ${!user ? html`<div class="notification is-danger">You do not have permission to import votes.</div>` : ''}

        <form onsubmit=${handleForm(dispatch, { type: 'import:voteImportFormSubmitted', short_id: location.params.shortId })} class=${user ? '' : 'is-hidden'}>

          ${error ? html`<div class="notification is-danger">${error.message}</div>` : ''}

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
              <input name="twitter_username" required class="input" placeholder="@username" />
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
              <textarea required name="comment" autocomplete="off" class="textarea" placeholder="Copy an excerpt from an externally published opinion to add to the bill page.\nOnce imported & approved, anyone will be able to Back it."></textarea>
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
