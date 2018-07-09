const Component = require('./Component')

module.exports = class LegislationShareButtons extends Component {
  render() {
    const { config } = this.state
    const { author_username, number, short_id, title, type, vote_position } = this.props
    const share_url = author_username
      ? `${config.WWW_URL}/${author_username}/legislation/${short_id}`
      : `${config.WWW_URL}/legislation/${short_id}`
    const bill_title = type && number ? `${type} ${number} — ${title}` : title
    const twitter_bill_title = type && number ? `${type} ${number}` : title
    const twitter_share_text = vote_position && vote_position !== 'abstain'
      ? `Join me in voting ${vote_position} on ${twitter_bill_title} at ${share_url}`
      : `Join me in voting on ${twitter_bill_title} at ${share_url}`
    const email_share_subject = vote_position && vote_position !== 'abstain'
      ? `Join me in voting ${vote_position} on ${bill_title}`
      : `Join me in voting on ${bill_title}`
    const email_share_body = `${email_share_subject}, at ${share_url}`
    const email_url = `mailto:?to=&body=${email_share_body}&subject=${email_share_subject}`
    const twitter_url = `https://twitter.com/intent/tweet?text=${twitter_share_text}`
    const facebook_url = `https://www.facebook.com/sharer/sharer.php?u=${share_url}`

    return this.html`
      <div class="buttons has-addons is-right">
        <div class="button is-small is-static">Share</div>
        <a class="button is-small" href="${twitter_url}" title="Share on Twitter">
          <span class="icon"><i class="fa fa-twitter"></i></span>
          <span>Twitter</span>
        </a>
        <a class="button is-small" href="${facebook_url}" title="Share on Facebook">
          <span class="icon"><i class="fa fa-facebook"></i></span>
          <span>Facebook</span>
        </a>
        <a class="button is-small" href="${email_url}" title="Share via Email">
          <span class="icon"><i class="fa fa-envelope-o"></i></span>
          <span>Email</span>
        </a>
      </div>
    `
  }
}
