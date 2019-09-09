const { html } = require('../helpers')

module.exports = ({ error, location, measures }, dispatch) => {
  const measure = Object.values(measures).filter(({ id }) => id === location.query.measure_id)[0]
  return html`
    <section class="section">
      <div class="columns is-centered">
        <div class="column is-half">
          <div class="content">
            <p class="title is-4">
              ${error
                ? html`<p>There was an error on our end. Please <a href="mailto:support@liquid.us" onclick=${(event) => dispatch({ type: 'contactForm:toggled', event })}>contact support<a> to unsubscribe.</p>`
                : html`<p>You have successfully unsubscribed${measure ? html`<span> from updates for <a href="${`/${measure.author ? measure.author.username : 'legislation'}/${measure.short_id}`}">${measure.title}</a></span>` : html`.`}</p>`
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
