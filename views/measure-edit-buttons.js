const { html } = require('../helpers')

module.exports = ({ loading, storage, user }, measure, dispatch) => {
  return html`
    <div class="buttons has-addons is-right">
      ${editButton({ measure, user })}
      ${publishButton({ loading, storage, measure }, dispatch)}
    </div>
  `
}

const editButton = ({ measure, user }) => {
  return html`
    <a href="${`/${user.username}/legislation/${measure.short_id}/edit`}" class="button is-small">
      <span class="icon is-small"><i class="fa fa-pencil-alt"></i></span><span>Edit</span>
    </a>
  `
}

const publishButton = ({ loading, storage, measure }, dispatch) => {
  return html`
    <a href="#" onclick="${onclick({ storage }, measure, dispatch)}" class="${`button is-small is-outlined ${loading.publishMeasure ? 'is-loading' : ''}`}">
      <span class="icon"><i class="fa fa-check"></i></span>
      <span>Publish</span>
    </a>
  `
}

const onclick = (state, measure, dispatch) => (event) => {
  event.preventDefault()

  const msg = `
    Are you sure you want to publish?
    Once your legislation is published, you will no longer be able to edit it.
  `
  if (window.confirm(msg)) {
    dispatch({ type: 'measure:published', measure })
  }
}
