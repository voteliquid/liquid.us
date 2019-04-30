const { html } = require('../helpers')

module.exports = ({ url }) => {
  return html`
    <div class="responsive-video-outer">
      <div class="responsive-video-inner reveal">
        <iframe width="560" height="315" src="${url}" frameborder="0" allowfullscreen></iframe>
      </div>
    </div>
  `
}
