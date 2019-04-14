const { html } = require('../helpers')

module.exports = ({ url }) => {
  return html`
    <div style="max-width: 600px; margin: 50px auto 0">
      <div class="responsive-video-wrapper reveal">
        <iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>
      </div>
    </div>
  `
}
