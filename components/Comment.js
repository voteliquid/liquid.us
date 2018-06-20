const Component = require('./Component')
const timeAgo = require('timeago.js')

module.exports = class Comment extends Component {
  render() {
    const { comment, updated_at, endorsements, fullname, id, number, proxy_vote_count, position, show_bill, short_id, short_title, type, username, user_id } = this.props
    const { config, selected_profile, user } = this.state
    const avatarURL = this.avatarURL(this.props)
    const comment_url = `/legislation/${short_id}/votes/${id}`
    const share_url = `${config.WWW_URL}/legislation/${short_id}/votes/${id}`
    const subject = fullname ? `${fullname} is` : 'People are'
    const email_share_body = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${type} ${number} ${short_title}. See why: ${share_url}`
    const email_share_subject = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${type} ${number} ${short_title}.`
    const twitter_share_text = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${type} ${number}. See why: ${share_url}`

    return this.html`
      <div class="box" style="margin-bottom: 1.5rem;">
        <div class="columns">
          <div class="column">
            ${show_bill && selected_profile
              ? [`
                  <span>
                    ${selected_profile.first_name} voted <strong>${position}</strong>${proxy_vote_count ? ` on behalf of ${proxy_vote_count} ${proxy_vote_count === 1 ? 'person' : 'people'}` : ''}
                    <br />
                    <a href="${`/legislation/${short_id}`}"><strong>${type.toUpperCase()} ${number}</strong>. ${short_title}</a>
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
            ${endorsements !== false && user
              ? CommentEndorseButton.for(this, this.props, `endorsebtn-${id}`)
              : endorsements > 0 ? [`
                  <span>&nbsp;</span>
                  <span class="icon is-small" style="height: 1em; width: 1.5em;"><i class="fa fa-thumbs-o-up"></i></span>
                  <span>${endorsements}</span>
                `] : []}
          </div>
          <div class="column is-two-thirds has-text-right has-text-left-mobile">
            <span>Share ${user && user.id === user_id ? 'your' : 'this'} comment:</span>
            <a target="_blank" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-facebook"></i></span></a>
            <a target="_blank" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-twitter"></i></span></a>
            <a target="_blank" href="${`mailto:?to=&body=${email_share_body}&subject=${email_share_subject}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-envelope"></i></span></a>
          </div>
        </div>
      </div>
    `
  }
}

class CommentEndorseButton extends Component {
  onsubmit(event) {
    event.preventDefault()

    const { endorsed, legislation_id, position, id } = this.props
    const { selected_bill, user } = this.state

    if (endorsed) {
      return this.api(`/comment_endorsements?user_id=eq.${user.id}&legislation_id=eq.${legislation_id}&vote_id=eq.${id}`, {
        method: 'DELETE',
      }).then(() => {
        if (selected_bill.comment) {
          selected_bill.comment.endorsements -= 1
          selected_bill.comment.endorsed = false
        } else {
          selected_bill[`${position}_comments`] = selected_bill[`${position}_comments`].map(comment => {
            if (comment.id === id) {
              comment.endorsements -= 1
              comment.endorsed = false
            }
            return comment
          })
        }
        return { selected_bill }
      })
    }

    return this.api('/comment_endorsements', {
      headers: { Prefer: 'return=representation' },
      method: 'POST',
      body: JSON.stringify({
        vote_id: id,
        user_id: user.id,
        legislation_id,
      })
    }).then(() => {
      if (selected_bill.comment) {
        selected_bill.comment.endorsements += 1
        selected_bill.comment.endorsed = true
      } else {
        selected_bill[`${position}_comments`] = selected_bill[`${position}_comments`].map(comment => {
          if (comment.id === id) {
            comment.endorsements += 1
            comment.endorsed = true
          }
          return comment
        })
      }
      return { selected_bill }
    })
  }
  render() {
    const { endorsed, endorsements } = this.props

    return this.html`
      <span>&nbsp;</span>
      <form class="is-inline has-text-right" method="POST" onsubmit=${this} action=${this}>
        <style>
          .endorse.button.is-text {
            padding: 0!important;
            border: none;
            color: inherit;
            height: 1em;
            text-decoration: none;
          }
          .endorse.button.is-text:hover, .button.is-text:active, .button.is-text:focus {
            color: inherit;
            border: none;
            background: transparent;
            box-shadow: none;
            -webkit-box-shadow: none;
          }
        </style>
        <button type="submit" class=${`endorse button is-text ${endorsed ? 'has-text-link' : ''}`}>
          <span class="icon is-small" style="height: 1em; width: 1.5em;"><i class="fa fa-thumbs-o-up"></i></span>
          <span>${endorsements > 0 ? endorsements : ''}</span>
        </button>
      </form>
    `
  }
}
