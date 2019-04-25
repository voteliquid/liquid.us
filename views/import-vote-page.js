const { handleForm, html } = require('../helpers')

module.exports = ({ error, location, user }, dispatch) => {
  return html`
    <section class="section">
      <div class="container is-widescreen">
        <h2 class="title is-size-5">Import Vote</h2>
        ${!user || !user.is_admin ? html`<div class="notification is-danger">You do not have permission to import votes.</div>` : ''}
        <form onsubmit=${handleForm(dispatch, { type: 'import:voteImportFormSubmitted', short_id: location.params.shortId })} class=${user && user.is_admin ? '' : 'is-hidden'}>
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
}
