const Component = require('./Component')
const timeAgo = require('timeago.js')

module.exports = class Comment extends Component {
  render() {
    const { comment, updated_at, fullname, id, number, proxy_vote_count, position, show_bill, short_id, title, type, username, user_id } = this.props
    const { config, selected_profile, user } = this.state
    const avatarURL = this.avatarURL(this.props)
    const measure_url = type === 'PN' ? `/nominations/${short_id}` : `/legislation/${short_id}`
    const comment_url = type === 'PN' ? `/nominations/${short_id}` : `/legislation/${short_id}/votes/${id}`
    const share_url = type === 'PN' ? `${config.WWW_URL}${measure_url}` : `${config.WWW_URL}/legislation/${short_id}/votes/${id}`
    const subject = fullname ? `${fullname} is` : 'People are'
    const measure_title = type && number ? `${type} ${number} — ${title}` : title
    const twitter_measure_title = type && number ? `${type} ${number}` : title
    const email_share_body = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${measure_title}. See why: ${share_url}`
    const email_share_subject = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${measure_title}.`
    const twitter_share_text = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${twitter_measure_title}. See why: ${share_url}`

    return this.html`
      <div class="box" style="margin-bottom: 1.5rem;">
        <div class="columns">
          <div class="column">
            ${show_bill && selected_profile
              ? [`
                  <span>
                    ${selected_profile.first_name} voted <strong>${position}</strong>${proxy_vote_count ? ` on behalf of ${proxy_vote_count} ${proxy_vote_count === 1 ? 'person' : 'people'}` : ''}
                    <br />
                    <a href="${measure_url}">${measure_title}</a>
                  </span>
                `]
              : [`
                  <div class="media">
                    <div class="media-left">
                      <div class="image is-32x32">
                        ${username
                          ? `<a href="/${username}">
                              <img src="${avatarURL}" alt="avatar" class="round-avatar-img" />
                            </a>`
                          : `<img src="${avatarURL}" alt="avatar" class="round-avatar-img" />`}
                      </div>
                    </div>
                    <div class="media-content">
                      ${username ? `<a href="/${username}">${fullname}</a>` : 'Anonymous'}
                      <span>voted <strong>${position}</strong>${proxy_vote_count ? ` on behalf of ${proxy_vote_count} ${proxy_vote_count === 1 ? 'person' : 'people'}` : ''}</span>
                    </div>
                  </div>
                `]}
          </div>
        </div>
        <div class="content">${[this.linkifyUrls(comment)]}</div>
        <div class="columns is-gapless is-multiline is-size-7 has-text-grey-light">
          <div class="column is-one-third">
            <a class="has-text-grey-light" href="${comment_url}">${timeAgo().format(`${updated_at}Z`)}</a>
          </div>
          <div class="column is-two-thirds has-text-right has-text-left-mobile">
            <span>Share:</span>
            <a target="_blank" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-facebook"></i></span></a>
            <a target="_blank" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-twitter"></i></span></a>
            <a target="_blank" href="${`mailto:?to=&body=${email_share_body}&subject=${email_share_subject}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-envelope"></i></span></a>
          </div>
        </div>
      </div>
    `
  }
}
