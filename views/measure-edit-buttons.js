const { handleForm, html } = require('../helpers')

module.exports = (user, measure, dispatch) => {
  return html`
    <div class="buttons has-addons">
      <a href="${`/${user.username}/${measure.short_id}/edit`}" class="button is-small">
        <span class="icon is-small"><i class="fa fa-pencil-alt"></i></span><span>Edit</span>
      </a>
      <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:deleteFormSubmitted', measure })}>
        <button type="submit" class="button is-small">
          <span class="icon is-small"><i class="fa fa-trash"></i></span><span>Delete</span>
        </button>
      </form>
    </div>
  `
}
