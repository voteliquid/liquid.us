const { WWW_URL } = process.env
const { html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faTwitter } = require('@fortawesome/free-brands-svg-icons/faTwitter')
const { faFacebook } = require('@fortawesome/free-brands-svg-icons/faFacebook')
const { faLink } = require('@fortawesome/free-solid-svg-icons/faLink')

module.exports = (state) => {
  const ClipboardJS = typeof window === 'object' && require('clipboard')
  const { author_username, copied2clipboard, short_id, type, vote } = state

  let share_url = author_username
  if (!author_username) {
    share_url = type === 'nomination' ? 'nominations' : 'legislation'
  }
  share_url = `${WWW_URL}/${share_url}/${short_id}`

  const twitter_share_text =
    vote && vote.position !== 'abstain'
      ? `Join me in voting ${vote.position}. ${share_url}`
      : `Vote now! Tell your elected representatives what you think and see arguments from other voters. ${share_url}`
  const twitter_url = `https://twitter.com/intent/tweet?text=${twitter_share_text}`
  const facebook_url = `https://www.facebook.com/sharer/sharer.php?u=${share_url}`

  return html`
    <a class="is-small" href="${twitter_url}" title="Share on Twitter">
      <span class="icon">${icon(faTwitter)}</span><span>Twitter</span>
    </a>
    <a class="is-small" href="${facebook_url}" title="Share on Facebook">
      <span class="icon">${icon(faFacebook)}</span><span>Facebook</span>
    </a>
    <link rel="stylesheet" href="/assets/bulma-tooltip.min.css">
    <a
      class="${`permalink is-small ${ClipboardJS && ClipboardJS.isSupported() ? 'tooltip' : ''} ${copied2clipboard ? 'is-tooltip-active is-tooltip-info' : ''}`}"
      data-tooltip="${copied2clipboard ? 'Copied URL to clipboard' : 'Copy URL to clipboard'}"
      data-clipboard-text="${share_url}"
      href="${share_url}"
      title="Permalink"
      onclick=${copy2clipboard}
    >
      <span class="icon">${icon(faLink)}</span><span>Permalink</span>
    </a>
  `
}

const copy2clipboard = (event) => {
  event.preventDefault()
  const ClipboardJS = require('clipboard')
  const clipboard = new ClipboardJS('.permalink')
  clipboard.on('success', () => {
    this.setProps({ copied2clipboard: true }).render()
    setTimeout(() => this.setProps({ copied2clipboard: false }).render(), 2000)
  })
  clipboard.on('error', (error) => {
    console.log(error)
  })
}
