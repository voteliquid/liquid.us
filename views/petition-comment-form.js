const { handleForm, html } = require('../helpers')

module.exports = (state, dispatch) => {
  const { loading, measure } = state

  return html`
    <form class="content" onsubmit="${handleForm(dispatch, { type: 'petition:commentFormSubmitted', measure })}">
      <p>Tell others why you signed:</p>
      <div class="field">
        <div class="control">
          <textarea name="comment" class="textarea" required style="resize:none;"></textarea>
        </div>
      </div>
      <div class="control">
        <button class="${`button is-size-5 has-text-weight-bold is-fullwidth ${loading.form ? 'is-loading' : ''}`}" disabled=${loading.form} type="submit">Comment</button>
      </div>
    </form>
  `
}
