const Component = require('./Component')
const Comment = require('./Comment')
const LoadingIndicator = require('./LoadingIndicator')
const Sidebar = require('./MeasureDetailsSidebar')
const Endorse = require('./Endorse')
const { fetchConstituentVotes } = require('./MeasureDetailsPage').prototype

module.exports = class ReportCommentPage extends Component {
  oninit() {
    const { config, measures = {}, reps = [] } = this.state
    const { params } = this.props

    const url = `/measures_detailed?short_id=eq.${params.short_id}`

    if (!measures[params.short_id] || !measures[params.short_id].comment) {
      this.setState({ loading_measure: true })
      return this.fetchReport().then(() => this.setState({ loading: false }))
    }

    return this.api(url).then((results) => {
      const measure = results[0]

      if (!measure) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const voteUrl = `/${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}/votes/${params.comment_id}`

      if (measure.author_id && !params.username) {
        return this.location.redirect(301, `/${measure.author_username}${voteUrl}`)
      }

      if (!measure.author_id && params.username) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
      const officeId = repsInChamber[0] && repsInChamber[0].office_id
      return fetchConstituentVotes.call(this, measure, officeId).then(() => {
        return this.fetchComment(params.comment_id, measure).then(comment => {
          if (!comment) {
            this.location.setStatus(404)
            return this.setState({ loading_measure: false })
          }

          measure.comment = comment


          const page_title = `Report Comment`
          if (this.isBrowser) {
            const page_title_with_appname = `${page_title} | ${config.APP_NAME}`
            window.document.title = page_title_with_appname
            window.history.replaceState(window.history.state, page_title_with_appname, document.location)
          }
          this.setState({
            loading_measure: false,
            page_title,
            measures: {
              ...this.state.measures,
              [measure.short_id]: {
                ...this.state.measures[measure.short_id],
                ...measure
              },
            },
          })
        })
      })
    })
    .catch((error) => {
      console.log(error)
      this.location.setStatus(404)
      return this.setState({ error, loading_measure: false })
    })
  }
  onsubmit(event, form) {
    event.preventDefault()

    const { editing_report, loading } = this.state

    if (!loading) {
      if (editing_report.id) {
        return this.updateReport(event, form)
      }
      return this.insertReport(event, form)
    }
  }
  fetchReport() {
    const { editing_report, user } = this.state
    const { params } = this.props
    return this.api(`/reports?reporter_id=eq.${user.id}&${editing_report.id ? `id=eq.${editing_report.id}` : `short_id=eq.${params.short_id}`}`)
      .then((report) => {
        if (report[0]) {
          return this.setState({ editing_bill: report[0] })
        }
      })
  }
  insertReport(event, form) {
    const { user, vote, measure } = this.state
    const { params } = this.props
    const url = `${measure.author_username ? `/${measure.author_username}/` : '/'}${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}`

    this.setState({ loading: 'saving' })

    return this.api('/events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        reporter_id: user.id,
        comment_author_id: vote.author_id,
        vote_id: params.vote_id,
        explanation: form.explanation
      })
    })
    .then((reports) => {
      event.target.reset()

      const proposed_report = reports[0]

      this.setState({
        editing_report: {},
        loading: false,
        yourReports: [proposed_report].concat(this.state.yourReports || []),
      })
    })
    .then(() => this.location.redirect(303, `${url}`))
    .catch((api_error) => this.handleError(api_error))
  }
  updateReport(event, form) {
    const { editing_report, measure } = this.state
    this.setState({ loading: 'saving' })
    const url = `${measure.author_username ? `/${measure.author_username}/` : '/'}${measure.type === 'PN' ? 'nominations' : 'legislation'}/${measure.short_id}`

    return this.api(`/report?id=eq.${editing_report.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(form),
    })
    .then((reports) => {
      const report = reports[0]
      this.setState({
        loading: false,
        yourReport: (this.state.yourReport || []).map((old) => (old.id === editing_report.id ? report : old)),
      })
 this.location.redirect(303, `${url}`)

    })
    .catch((api_error) => this.handleError(api_error))
  }
  fetchComment(id, measure) {
    return this.api(`/votes_detailed?measure_id=eq.${measure.id}&id=eq.${id}`).then(([comment]) => (comment))
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) {
      this.oninit().then((newState) => this.setState(newState))
    }
  }
  render() {
    const { loading_measure, measures, loading = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]
    const commGuidelines = 'The spirit of this community is one of honesty and tolerance for other viewpoints. We strive to make this a place for expressing and discussing nuanced opinion. There is no place here for violence or its threat.'
    const commQuestion = 'Do you believe this comment should be reported?'
    return this.html`

    <div class="container is-widescreen">

    <div class="columns" align = "center">
      <div class="column is-centered is-two-thirds-tablet is-one-half-desktop">
      <h2 class="title has-text-weight-normal is-4"><span>Report this comment?</span></h2>
      ${commGuidelines}
      <br><br>
      <form method="POST" onsubmit=${this} action=${this}>
      <div class="field">
        <label for="details" class="label hidden has-text-grey">${commQuestion}<br></label>
        <div class="control">
          <textarea name="details" autocomplete="off" class="textarea" rows="3" placeholder="Add an explanation (optional)."></textarea>
        </div>
      </div>
      <div class="field is-grouped">
        <div class="control">
          <button class=${`button is-primary ${loading === 'saving' ? 'is-loading' : ''}`} disabled="${loading}" type="submit">
            <span class="icon"><i class="fa fa-edit"></i></span>
            <span>Save</span>
          </button>
        </div>
      </div>
      </form>
</div>
</div>
    <div>${
      loading_measure
        ? LoadingIndicator.for(this)
        : measure && measure.comment
          ? CommentDetailPage.for(this, { measure })
          : CommentNotFoundPage.for(this)
    }</div>`
  }
}

class CommentNotFoundPage extends Component {
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

class CommentDetailPage extends Component {
  render() {
    const { legislatures = [], user } = this.state
    const { measure: l } = this.props
    const title = l.type === 'PN' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title
    const url = `${l.author_username ? `/${l.author_username}/` : '/'}${l.type === 'PN' ? 'nominations' : 'legislation'}/${l.short_id}`
    const userInJurisdiction = user && legislatures && legislatures.some(({ name }) => name === l.legislature_name)

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <div class="columns">
            <div class="column">
              <h2 class="title has-text-weight-normal is-4"><a class="has-text-dark" href="${url}">${title}</a></h2>
              <div class="subtitle is-size-7">
                <a class="is-size-7 has-text-grey button is-text" href="${url}">
                  <span>More details</span>
                </a>
              </div>
              ${Comment.for(this, { ...l.comment, shouldTruncate: false })}
              ${l.comment && (!user || userInJurisdiction) ? Endorse.for(this, { vote: l.comment, vote_position: l.vote_position, user }) : ''}
              <br />
              <div>
                <a class="is-size-7 has-text-grey button is-text" href="${url}">
                  <span>See all arguments</span>
                </a>
              </div>
            </div>
            <div class="column is-one-quarter">
              ${Sidebar.for(this, { ...l, user }, `commentpage-sidebar-${l.id}`)}
            </div>
          </div>
        </div>
      </section>
    `
  }
}