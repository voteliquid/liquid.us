const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { loading, vote } = state

  let afterEndorseMessage = 'Tell others why you endorsed'
  if (vote.position === 'nay') { afterEndorseMessage = 'Tell others why you opposed' }
  if (vote.position === 'abstain') { afterEndorseMessage = 'Share your feedback, questions and ideas here' }

  return html`
    <form class="content" onsubmit="${handleForm(dispatch, { type: 'vote:replied', vote })}">
      <p>${afterEndorseMessage}:</p>
      <div class="field">
        <div class="control">
          <textarea name="content" class="textarea" required style="resize:none;"></textarea>
        </div>
      </div>
      <div class="control">
        <button class="${`button is-size-5 is-link has-text-weight-bold is-fullwidth ${loading.comments ? 'is-loading' : ''}`}" disabled=${loading.comments} type="submit">Save</button>
      </div>
    </form>
  `
}
