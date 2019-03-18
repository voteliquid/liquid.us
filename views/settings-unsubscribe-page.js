const { html } = require('../helpers')

module.exports = ({ error }) => {
  return html`
    <section class="section">
      <div class="columns is-centered">
        <div class="column is-half">
          <div class="content">
            <p class="title is-4">
              ${error
                ? 'There was a problem saving your unsubscribe request.'
                : `You have successfully unsubscribed.`
              }
            </p>
            <p>
              <a href="/settings">Manage your notifications settings</a>.
            </p>
          </div>
        </div>
      </div>
    </section>
  `
}
