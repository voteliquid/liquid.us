const { html } = require('../helpers')
const activityIndicator = require('./activity-indicator')

module.exports = () => {
  return html`
    <div>${activityIndicator()}</div>
  `
}
