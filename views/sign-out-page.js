const { html } = require('../helpers')
const activityIndicator = require('./activity-indicator')

module.exports = () => {
  return html`
    <section class="section hero">
      <div class="hero-body has-text-centered">
        ${activityIndicator()}
      </div>
    </div>
  `
}
