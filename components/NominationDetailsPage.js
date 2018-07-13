const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureDetails = require('./MeasureDetails')
const NotFound = require('./NotFound')

module.exports = class NominationDetailsPage extends Component {
  oninit() {
    const { config } = this.state
    const { params } = this.props

    const url = `/measures_detailed?short_id=eq.${params.short_id}&type=eq.PN`

    this.setState({ loading_bill: true })

    return this.api(url).then((bills) => {
      const selected_bill = bills[0]
      const title = `${selected_bill.type} ${selected_bill.number} – ${selected_bill.title}`

      if (selected_bill) {
        if (this.isBrowser) {
          const page_title = `${title} ★ ${config.APP_NAME}`
          window.document.title = page_title
          window.history.replaceState(window.history.state, page_title, document.location)
        }

        return this.fetchComments(selected_bill).then(({ yea_comments, nay_comments }) => {
          selected_bill.yea_comments = yea_comments
          selected_bill.nay_comments = nay_comments
          return {
            loading_bill: false,
            page_title: title,
            page_description: `Vote directly on legislative bills. We'll notify your representatives and grade them for how well they listen to their constituents.`,
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
    return this.api(`/public_votes?measure_id=eq.${selected_bill.id}&comment=not.eq.&comment=not.is.null&order=proxy_vote_count.desc.nullslast,created_at.desc`)
    .then(comments => ({
      yea_comments: comments.filter(({ position }) => position === 'yea'),
      nay_comments: comments.filter(({ position }) => position === 'nay'),
    }))
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
        : selected_bill
          ? MeasureDetails.for(this)
          : NotFound.for(this)
    }</div>`
  }
}
