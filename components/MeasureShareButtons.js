const { WWW_URL } = process.env
const Component = require('./Component')

module.exports = class LegislationShareButtons extends Component {
  onclick(event) {
    event.preventDefault()
    document.querySelector('.copy2clipboard').select()
    document.execCommand('copy')
    this.setProps({ copied2clipboard: true }).render()
    setTimeout(() => this.setProps({ copied2clipboard: false }).render(), 2000)
  }
  render() {
    const { author_username, copied2clipboard, number, short_id, title, type, vote_position } = this.props
    const share_url = author_username
      ? `${WWW_URL}/${author_username}/${type === 'PN' ? 'nominations' : 'legislation'}/${short_id}`
      : `${WWW_URL}/${type === 'PN' ? 'nominations' : 'legislation'}/${short_id}`
    const twitter_bill_title = type && number && type !== 'PN' ? `${type} ${number}` : title.replace(/\.$/, '')
    const twitter_share_text =
      vote_position && vote_position !== 'abstain'
        ? `Join me in voting ${vote_position} ${type === 'PN' ? 'on the confirmation of' : 'on'} ${twitter_bill_title} at ${share_url}`
        : `Join me in voting ${type === 'PN' ? 'on the confirmation of' : 'on'} ${twitter_bill_title} at ${share_url}`
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
        class="${`tooltip is-small ${copied2clipboard ? 'is-tooltip-active is-tooltip-info' : ''}`}"
        data-tooltip="${copied2clipboard ? 'Copied URL to clipboard' : 'Copy URL to clipboard'}"
        href="${share_url}"
        title="Permalink"
        onclick=${this}
      >
        <span class="icon"><i class="fa fa-link"></i></span><span>Permalink</span>
      </a>
      <textarea class="copy2clipboard" style="position: absolute; left: -9999px;" readonly>${share_url}</textarea>
    `
  }
}
