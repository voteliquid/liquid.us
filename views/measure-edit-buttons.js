const { handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faPencilAlt } = require('@fortawesome/free-solid-svg-icons/faPencilAlt')
const { faTrash } = require('@fortawesome/free-solid-svg-icons/faTrash')

module.exports = (user, measure, dispatch) => {
  return html`
    <div class="buttons has-addons is-right">
      <a href="${`/${user.username}/${measure.short_id}/edit`}" class="button is-small">
        <span class="icon is-small">${icon(faPencilAlt)}</span><span>Edit</span>
      </a>
      <form method="POST" onsubmit=${handleForm(dispatch, { type: 'measure:deleteFormSubmitted', measure })}>
        <button type="submit" class="button is-small">
          <span class="icon is-small">${icon(faTrash)}</span><span>Delete</span>
        </button>
      </form>
    </div>
  `
}
