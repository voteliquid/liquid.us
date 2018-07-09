const LegislationTitle = require('./LegislationTitle')
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
    const { config } = this.state
    const { params } = this.props

    const url = `/legislation_detail?short_id=eq.${params.short_id}`

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
    const { config, selected_bill: l } = this.state
    const bill_id = l.introduced_at ? `${l.type} ${l.number}` : l.title

    return this.html`
      <section class="section">
        <div class="container">
          <nav class="breadcrumb has-succeeds-operator is-left is-small" aria-label="breadcrumbs">
            <ul>
              <li><a class="has-text-grey" href="/">${config.APP_NAME}</a></li>
              <li><a class="has-text-grey" href="/legislation">Legislation</a></li>
              <li><a class="has-text-grey" href=${`/legislation/${l.short_id}`}>${bill_id}</a></li>
              <li class="is-active"><a class="has-text-grey" href="#" aria-current="page">${this.possessive(l.comment.fullname || 'Anonymous')} vote</a></li>
            </ul>
          </nav>
          ${LegislationTitle.for(this)}
          <hr />
          ${Comment.for(this, l.comment)}
        </div>
      </section>
    `
  }
}
