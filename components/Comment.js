const Component = require('./Component')
const timeAgo = require('timeago.js')

module.exports = class Comment extends Component {
  render() {
    const { comment, updated_at, endorsements, fullname, id, number, position, show_bill, short_id, short_title, type, username } = this.props
    const { selected_profile, user } = this.state
    const avatarURL = this.avatarURL(this.props)

    return this.html`
      <div class="box" style="margin-bottom: 1.5rem;">
        <div class="columns is-multiline is-gapless">
          <div class="column">
            ${show_bill && selected_profile
              ? [`
                  <span>
                    ${selected_profile.first_name} voted <strong>${position}</strong> on
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
                      <span>voted ${position}</span>
                    </div>
                  </div>
                `]}
          </div>
          <div class="column is-one-third has-text-right has-text-left-mobile">
            <a class="has-text-grey-light" href="${`/legislation/${short_id}/votes/${id}`}">${timeAgo().format(`${updated_at}Z`)}</a>
            ${endorsements !== false && user
              ? CommentEndorseButton.for(this, this.props, `endorsebtn-${id}`)
              : endorsements > 0 ? [`
                  <span>&nbsp;</span>
                  <span class="icon"><i class="fa fa-thumbs-o-up"></i></span>
                  <span>${endorsements}</span>
                `] : []}
          </div>
        </div>
        <div class="content">${[this.linkifyUrls(comment)]}</div>
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
          <span class="icon" style="margin-right: 0"><i class="fa fa-thumbs-o-up"></i></span>
          <span>${endorsements > 0 ? endorsements : ''}</span>
        </button>
      </form>
    `
  }
}
