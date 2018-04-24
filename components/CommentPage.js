const Component = require('./Component')
const timeAgo = require('from-now')
const LoadingIndicator = require('./LoadingIndicator')

const ago_opts = {
  seconds: 's',
  minutes: 'min',
  hours: 'h',
  days: 'd',
  weeks: 'w',
  months: { 1: 'month', 2: 'months' },
  years: 'y',
}

module.exports = class CommentPage extends Component {
  oninit() {
    const { config, user } = this.state
    const { params } = this.props

    const fields = [
      'short_title', 'number', 'type', 'short_id', 'id', 'committee',
      'sponsor_username', 'sponsor_first_name', 'sponsor_last_name', 'status',
      'sponsor_username_lower', 'introduced_at', 'last_action_at', 'yeas', 'nays',
      'abstains', 'summary', 'number', 'congress', 'chamber'
    ]
    if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name', 'constituent_yeas', 'constituent_nays')
    const url = `/legislation_detail?select=${fields.join(',')}&short_id=eq.${params.short_id}`

    this.setState({ loading_bill: true })

    return this.api(url).then((bills) => {
      const selected_bill = bills[0]

      if (selected_bill) {
        if (this.isBrowser) {
          const page_title = `${selected_bill.short_title} ★ ${config.APP_NAME}`
          window.document.title = page_title
          window.history.replaceState(window.history.state, page_title, document.location)
        }

        return this.fetchComments(selected_bill).then(({ comment }) => {
          selected_bill.comment = comment
          return {
            loading_bill: false,
            page_title: selected_bill.short_title,
            page_description: `Vote directly on bills in Congress. We'll notify your representatives and grade them for listening / ignoring their constituents.`,
            selected_bill: { ...bills[selected_bill.short_id], ...selected_bill },
            bills: { ...bills, [selected_bill.short_id]: selected_bill },
          }
        })
      }

      this.location.setStatus(404)
      return { loading_bill: false }
    })
    .catch((error) => {
      this.location.setStatus(404)
      return { error, loading_bill: false }
    })
  }
  fetchComments(selected_bill) {
    return this.api(`/public_votes?legislation_id=eq.${selected_bill.id}&id=eq.${this.props.params.comment_id}`)
    .then(([comment]) => ({ comment }))
  }
  onpagechange() {
    const { loading_bill, selected_bill } = this.state
    if (!loading_bill && selected_bill) {
      this.oninit().then((newState) => this.setState(newState))
    }
  }
  render() {
    const { loading_bill, selected_bill } = this.state

    return this.html`<div>${
      loading_bill
        ? LoadingIndicator.for(this)
        : selected_bill && selected_bill.comment
          ? BillFoundPage.for(this)
          : BillNotFoundPage.for(this)
    }</div>`
  }
}

class BillNotFoundPage extends Component {
  render() {
    return this.html`
      <section class="hero is-fullheight is-dark">
        <div class="hero-body">
          <div class="container has-text-centered">
            <h1 class="title">Can't find comment ${[this.location.path]}</h1>
            <h2 class="subtitle">Maybe the URL is mistyped?</h2>
          </div>
        </div>
      </section>
    `
  }
}

class BillFoundPage extends Component {
  render() {
    const { selected_bill: l, user } = this.state

    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a href="/legislation">Legislation</a></li>
              <li><a href=${`/legislation/${l.short_id}`}>${l.type} ${l.number}</a></li>
              <li class="is-active"><a href="#" aria-current="page">${l.comment.fullname}'s vote</a></li>
            </ul>
          </nav>
          <div class="content">
            <h2><a href=${`/legislation/${l.short_id}`} class="has-text-dark">${l.type} ${l.number} &mdash; ${l.short_title}</a></h2>
          </div>
          <p class="is-size-7 has-text-grey">
            ${l.sponsor_username
              ? [`Introduced by <a href=${`/${l.sponsor_username}`}>${l.sponsor_first_name} ${l.sponsor_last_name}</a> on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; Last action on ${new Date(l.last_action_at).toLocaleDateString()}`]
              : [`Introduced on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; last action on ${new Date(l.last_action_at).toLocaleDateString()}`]
            }
            &bullet; <a href=${`https://www.congress.gov/bill/${l.congress}th-congress/${l.chamber.toLowerCase()}-bill/${l.number}`} target="_blank">Bill details at congress.gov <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>
          </p>
          <hr />
          ${Comment.for(this, l.comment)}
        </div>
      </section>
    `
  }
}

class Comment extends Component {
  linkifyUrls(text) {
    this.htmlTagsToReplace = this.htmlTagsToReplace || {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;'
    }
    this.htmlRegex = this.htmlRegex || /[&<>]/g
    this.urlRegex = this.urlRegex || /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig
    return text.replace(this.htmlRegex, (char) => {
      return this.htmlTagsToReplace[char] || char
    }).replace(this.urlRegex, (url) => {
      return `<a href="${url}">${url}</a>`
    })
  }
  render() {
    const { comment, created_at, endorsements, fullname, id, position, username } = this.props
    const { user } = this.state
    const avatarURL = this.avatarURL(this.props)

    return this.html`
      <div class="card is-small">
          <div style="box-shadow: 0 1px 2px rgba(10,10,10,.1); padding: .75rem;">
            <div class="level">
              <div class="level-left">
                <div class="level-item">
                  ${username
                  ? avatarURL
                    ? [`
                        <div class="media">
                          <div class="media-left">
                            <p class="image is-32x32">
                              <a href=${`/${username}`}>
                                <img src=${avatarURL} alt="avatar" class="round-avatar-img" />
                              </a>
                            </p>
                          </div>
                          <div class="media-content" style="align-self: center;">
                            <a href="/${username}">${fullname}</a>
                            voted <strong>${position}</strong>
                          </div>
                        </div>
                    `]
                    : [`
                      <a href="/${username}">${fullname}</a>
                    `]
                  : [`
                    <span class="has-text-grey-light">Anonymous</span> voted <strong>${position}</strong>
                  `]}
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  ${user
                    ? CommentEndorseButton.for(this, this.props, `endorsebtn-${id}`)
                    : endorsements > 0 ? [`
                        <span class="icon"><i class="fa fa-thumbs-o-up"></i></span>
                        <span>${endorsements}</span>
                        <span class="has-text-grey-light">&nbsp;&bullet;&nbsp;</span>
                      `] : []
                  }
                  <span class="has-text-grey-light">${timeAgo(`${created_at}Z`, ago_opts)} ago</span>
                </div>
            </div>
          </div>
        </div>
        <div class="card-content">${ comment ? [this.linkifyUrls(comment)] : ['<em>No comment</em>']}</div>
      </div>
      <br />
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
        selected_bill.comment.endorsements -= 1
        selected_bill.comment.endorsed = false
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
      selected_bill.comment.endorsements += 1
      selected_bill.comment.endorsed = true
      return { selected_bill }
    })
  }
  render() {
    const { endorsed, endorsements } = this.props

    return this.html`
      <form class="has-text-right" method="POST" onsubmit=${this} action=${this}>
        <style>
          .button.is-text {
            padding: 0!important;
            border: none;
            color: inherit;
            height: 1rem;
            text-decoration: none;
          }
          .button.is-text:hover, .button.is-text:active, .button.is-text:focus {
            color: inherit;
            border: none;
            background: transparent;
            box-shadow: none;
            -webkit-box-shadow: none;
          }
        </style>
          <button type="submit" class=${`button is-text ${endorsed ? 'has-text-link' : ''}`}>
            <span class="icon is-small" style="margin-right: 0"><i class="fa fa-thumbs-o-up"></i></span>
            <span>${endorsements > 0 ? endorsements : ''}</span>
          </button>
      </form>
      <span class="has-text-grey-light">&nbsp;&bullet;&nbsp;</span>
    `
  }
}
