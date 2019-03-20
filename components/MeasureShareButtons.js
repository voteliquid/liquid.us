const { WWW_URL } = process.env
const Component = require('./Component')

module.exports = class LegislationShareButtons extends Component {
  onclick(event) {
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
  render() {
    const ClipboardJS = typeof window === 'object' && require('clipboard')
    const { author_username, copied2clipboard, short_id, type, vote_position } = this.props
    const share_url = author_username
      ? `${WWW_URL}/${author_username}/${type === 'nomination' ? 'nominations' : 'legislation'}/${short_id}`
      : `${WWW_URL}/${type === 'nomination' ? 'nominations' : 'legislation'}/${short_id}`
    const twitter_share_text =
      vote_position && vote_position !== 'abstain'
        ? `Join me in voting ${vote_position}. ${share_url}`
        : `Vote now! Tell your elected representatives what you think and see arguments from other voters. ${share_url}`
    const twitter_url = `https://twitter.com/intent/tweet?text=${twitter_share_text}`
    const facebook_url = `https://www.facebook.com/sharer/sharer.php?u=${share_url}`

    return this.html`
      <a class="is-small" href="${twitter_url}" title="Share on Twitter">
        <span class="icon"><i class="fab fa-twitter"></i></span><span>Twitter</span>
      </a>
      <a class="is-small" href="${facebook_url}" title="Share on Facebook">
        <span class="icon"><i class="fab fa-facebook"></i></span><span>Facebook</span>
      </a>
      <link rel="stylesheet" href="/assets/bulma-tooltip.min.css">
      <a
        class="${`permalink is-small ${ClipboardJS && ClipboardJS.isSupported() ? 'tooltip' : ''} ${copied2clipboard ? 'is-tooltip-active is-tooltip-info' : ''}`}"
        data-tooltip="${copied2clipboard ? 'Copied URL to clipboard' : 'Copy URL to clipboard'}"
        data-clipboard-text="${share_url}"
        href="${share_url}"
        title="Permalink"
        onclick=${this}
      >
        <span class="icon"><i class="fa fa-link"></i></span><span>Permalink</span>
      </a>
    `
  }
}
