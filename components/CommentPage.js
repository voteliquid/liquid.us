const Component = require('./Component')
const Comment = require('./Comment')
const LoadingIndicator = require('./LoadingIndicator')

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
 }

module.exports = class CommentPage extends Component {
  oninit() {
    const { config, user } = this.state
    const { params } = this.props

    const fields = [
      'title', 'number', 'type', 'short_id', 'id',
      'sponsor_username', 'sponsor_first_name', 'sponsor_last_name', 'status',
      'introduced_at', 'last_action_at', 'yeas', 'nays',
      'abstains', 'number', 'congress', 'chamber', 'legislature_name'
    ]
    if (user) fields.push('vote_position', 'delegate_rank', 'delegate_name', 'constituent_yeas', 'constituent_nays')
    const url = `/legislation_detail?select=${fields.join(',')}&short_id=eq.${params.short_id}`

    this.setState({ loading_bill: true })

    return this.api(url).then((bills) => {
      const selected_bill = bills[0]

      if (selected_bill) {
        return this.fetchComments(selected_bill).then(comment => {
          selected_bill.comment = comment

          const page_title = `${this.possessive(comment.fullname || 'Anonymous')} vote on ${selected_bill.title}`
          if (this.isBrowser) {
            const page_title_with_appname = `${page_title} ★ ${config.APP_NAME}`
            window.document.title = page_title_with_appname
            window.history.replaceState(window.history.state, page_title_with_appname, document.location)
          }

          return {
            loading_bill: false,
            page_title,
            page_description: escapeHtml(comment.comment),
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
    .then(([comment]) => (comment))
  }
  onpagechange() {
    const { loading_bill, selected_bill } = this.state
    if (!loading_bill && selected_bill) {
      this.oninit().then((newState) => this.setState(newState))
    }
  }
  render() {
    const { loading_bill, selected_bill } = this.state

    return this.html`
      <div>
        ${loading_bill
            ? LoadingIndicator.for(this)
            : selected_bill && selected_bill.comment
              ? BillFoundPage.for(this)
              : BillNotFoundPage.for(this)}
      </div>
    `
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
    const { config, selected_bill: l } = this.state
    const bill_details_url = l.legislature_name === 'U.S. Congress'
      ? `https://www.congress.gov/bill/${l.congress}th-congress/${l.chamber.toLowerCase()}-bill/${l.number}`
      : `https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=${l.congress}0${l.type}${l.number}`
    const bill_details_name = l.legislature_name === 'U.S. Congress' ? 'congress.gov' : 'leginfo.legislature.ca.gov'


    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-operator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/legislation">${config.APP_NAME}</a></li>
              <li><a class="has-text-grey" href=${`/legislation/${l.short_id}`}>${l.type} ${l.number}</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">${this.possessive(l.comment.fullname || 'Anonymous')} vote</a></li>
            </ul>
          </nav>
          <h4 class="has-text-grey is-paddingless is-margin-less">${l.legislature_name}</h4>
          <h2 class="title has-text-weight-normal is-size-4" style="margin-bottom: .5rem;">${l.type} ${l.number} &mdash; ${l.title}</h2>
          <p class="is-size-7 has-text-grey">
            ${l.sponsor_username
              ? [`Introduced by <a href=${`/${l.sponsor_username}`}>${l.sponsor_first_name} ${l.sponsor_last_name}</a> on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; Last action on ${new Date(l.last_action_at).toLocaleDateString()}`]
              : [`Introduced on ${(new Date(l.introduced_at)).toLocaleDateString()} &bullet; last action on ${new Date(l.last_action_at).toLocaleDateString()}`]
            }
            &bullet; <a href=${bill_details_url} target="_blank">Bill details at ${bill_details_name} <span class="icon is-small"><i class="fa fa-external-link"></i></span></a>
          </p>
          <hr />
          ${Comment.for(this, l.comment)}
        </div>
      </section>
    `
  }
}
