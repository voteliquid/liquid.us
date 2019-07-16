const { html } = require('../helpers')

module.exports = ({ user }, measure) => {
  return html`
    <div class="buttons has-addons is-right">
      <a href="${`/${user.username}/${measure.short_id}/edit`}" class="button is-small">
        <span class="icon is-small"><i class="fa fa-pencil-alt"></i></span><span>Edit</span>
      </a>
    </div>
  `
}
