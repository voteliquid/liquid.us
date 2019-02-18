const { ASSETS_URL } = process.env
const Component = require('./Component')
const EndorsementPageComment = require('./EndorsementPageComment')
const LoadingIndicator = require('./LoadingIndicator')
const Sidebar = require('./EndorsementPageSidebar')
const MobileForm = require('./EndorsementPageMobileForm')
const MeasureSummary = require('./MeasureSummary')
const { fetchConstituentVotes } = require('./MeasureDetailsPage').prototype
const stateNames = require('datasets-us-states-abbr-names')
const { EndorsementCount } = require('./EndorsementPageSidebar')

module.exports = class CommentPage extends Component {
  oninit() {
    const { config, measures = {}, offices = [] } = this.state
    const { params } = this.props

    const url = `/measures_detailed?short_id=eq.${params.short_id}`

    if (!measures[params.short_id] || !measures[params.short_id].comment) {
      this.setState({ loading_measure: true })
    }

    return this.api(url).then((results) => {
      const measure = results[0]

      if (!measure) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const voteUrl = `/${measure.type === 'nomination' ? 'nominations' : 'legislation'}/${measure.short_id}/votes/${params.comment_id}`

      if (measure.author_id && !params.username) {
        return this.location.redirect(301, `/${measure.author_username}${voteUrl}`)
      }

      if (!measure.author_id && params.username) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
      const officeId = officesInChamber[0] && officesInChamber[0].id
      return fetchConstituentVotes.call(this, measure, officeId).then(() => {
        return this.fetchComment(params.comment_id, measure).then(comment => {
          if (!comment) {
            this.location.setStatus(404)
            return this.setState({ loading_measure: false })
          }

          measure.comment = comment
          const isCity = measure.legislature_name.includes(',')

          const anonymousName = `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`

          let legislature = `the ${measure.legislature_name} legislature`
          if (measure.legislature_name === 'U.S. Congress') {
            legislature = 'Congress'
          } else if (isCity) {
            legislature = `your ${measure.legislature_name}'s elected officials`
          }

          const page_title = `${comment.fullname || anonymousName}: Tell ${legislature} to vote ${comment.position} on ${measure.title}`
          if (this.isBrowser) {
            const page_title_with_appname = `${page_title} | ${config.APP_NAME}`
            window.document.title = page_title_with_appname
            window.history.replaceState(window.history.state, page_title_with_appname, document.location)
          }

          const inlineImageMatch = comment && comment.comment.match(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif)\b/i)
          const inlineImage = inlineImageMatch && inlineImageMatch[0]
          const measureImage = (!isCity) ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
          const authorImage = comment.username || comment.twitter_username ? this.avatarURL(comment) : null
          const ogImage = inlineImage || authorImage || measureImage

          this.setState({
            loading_measure: false,
            page_title,
            page_description: this.escapeHtml(comment.comment, { replaceAmp: true, stripImages: true }),
            og_image_url: ogImage,
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
  fetchComment(id, measure) {
    return this.api(`/votes_detailed?measure_id=eq.${measure.id}&id=eq.${id}`).then(([comment]) => (comment))
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url) {
      this.oninit().then((newState) => this.setState(newState))
    }
  }
  render() {
    const { loading_measure, measures = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    return this.html`<div>${
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
  triggerMobileForm() {
    return this.setState({ mobileFormVisible: !this.state.mobileFormVisible })
  }

  render() {
    const { user, mobileFormVisible } = this.state
    const { measure: l } = this.props

    const title = l.type === 'nomination' ? `Do you support ${l.title.replace(/\.$/, '')}?` : l.title

    return this.html`
      <section class="section">
        <div class="container is-widescreen">
          <div class="columns">
            <div class="column">
              <h2 class="title has-text-weight-semibold is-2 has-text-centered has-text-dark">${title}</h2>
              ${TargetReps.for(this, { measure: l })}
              <div class="small-screens-only">
                ${EndorsementCount.for(this, { measure: l })}
              </div>
              <br>
              ${EndorsementPageComment.for(this, { ...l.comment, shouldTruncate: false })}
              <div style="border-left: 2px solid hsl(0, 0%, 60%); padding-left: 2rem; margin-top: 2rem;">
                ${MeasureSummary.for(this, { measure: l, expanded: true, size: 5 }, `endorsement-${l.comment.id}`)}
              </div>
              <div class="small-screens-only">
                ${MobileHoverBar.for(this, { measure: l, user, onclick: this.triggerMobileForm.bind(this) })}
              </div>
              ${MobileForm.for(this, { ...l, user, visible: mobileFormVisible, onclick: this.triggerMobileForm.bind(this) })}
            </div>
            <div class="column is-one-quarter sticky-panel">
              <div class="panel-wrapper">
                ${Sidebar.for(this, { ...l, user }, `commentpage-sidebar-${l.id}`)}
              </div>
              <style>
                .sticky-panel.column {
                  display: none;
                }
                .small-screens-only {
                  display: block;
                }
                @media (min-width: 828px) {
                  .sticky-panel.column {
                    display: block;
                  }
                  .sticky-panel .content {
                    max-width: 253px;
                  }

                  .panel-wrapper {
                    position: fixed;
                    margin-left: 2rem;
                    margin-right: 15px;
                    z-index: 15;
                  }

                  .small-screens-only {
                    display: none;
                  }
                }

                @media (max-height: 575px) {
                  /* Don't position:fixed the sidebar if window isn't tall enough */
                  .panel-wrapper {
                    position: relative;
                    margin-right: 0;
                    z-index: 1;
                  }
                }
              </style>
            </div>
          </div>
        </div>
      </section>
    `
  }
}

class MobileHoverBar extends Component {
  render() {
    const { measure } = this.props

    let action = 'Endorse'; let color = 'is-success'
    if (measure.comment.position === 'nay') { action = 'Join opposition'; color = 'is-danger' }
    if (measure.comment.position === 'abstain') { action = 'Join abstention'; color = 'is-dark' }
    if (measure.comment.endorsed) { action = 'Share'; color = 'is-link' }

    return this.html`
      <div style="
        position: fixed;
        left: 0; bottom: 0;
        width: 100%;
        z-index: 18;
        background: white;
        border-top: 1px solid #ccc;
        padding: 10px 15px;
      ">
        <div class="field">
          <div class="control">
            <button class=${`button ${color} is-fullwidth fix-bulma-centered-text has-text-weight-bold is-size-5`} onclick=${this.props.onclick}>${action}</button>
          </div>
        </div>
      </div>
    `
  }
}

class TargetReps extends Component {
  render() {
    const { user, reps } = this.state
    const { measure } = this.props

    const targetReps = reps.filter(r =>
      r.legislature.short_name === measure.legislature_name
      || r.legislature.name === measure.legislature_name
    )

    return this.html`
      <br />
      <div class="columns" style="margin-bottom: 0">
        <div class="column is-narrow">
          <span class="is-size-4 has-text-weight-semibold">To:&nbsp;</span>
        </div>
        ${targetReps.map(r => Rep.for(this, { r }, `rep-${r.id}`))}
        <div class="column">
          <span class="has-text-weight-semibold is-size-5">${targetReps.length ? 'And t' : 'T'}he ${measure.legislature_name} Legislature</span>
        </div>
      </div>
      ${!(user && user.address) ? NotYourRepsMessage.for(this, { measure }) : []}
    `
  }
}

class Rep extends Component {
  render() {
    const { r } = this.props
    const rep = r.office_holder
    const position = r.name.split(' ').slice(2).join(' ')
    return this.html`
      <div class="column is-narrow">

        <div class="media" style="margin-bottom: 1.5em;">
          <div class="media-left">
            <div class="image is-48x48">
              <img src=${this.avatarURL(rep)} />
            </div>
          </div>
          <div class="media-content is-vcentered">
            <div class="has-text-weight-semibold is-size-5">
              ${rep.first_name} ${rep.last_name}, ${r.legislature.short_name}<br/> ${position}
            </div>
          </div>
        </div>

      </div>
    `
  }
}

class NotYourRepsMessage extends Component {
  onclick(event) {
    event.preventDefault()
    return this.setState({ notYourRepsMessageVisible: !this.state.notYourRepsMessageVisible })
  }

  render() {
    const { measure } = this.props
    const { notYourRepsMessageVisible } = this.state

    let action = 'Endorse'
    if (measure.comment.position === 'nay') { action = 'Join opposition' }
    if (measure.comment.position === 'abstain') { action = 'Join abstention' }

    return this.html`
      <p class="is-size-7" style="position: relative; bottom: 1rem;">
        <a onclick=${this}>Not your representatives?</a>
        ${notYourRepsMessageVisible ? [`
          <span class="has-text-weight-semibold">Enter your address and press ${action} to send to your correct reps.</span>
        `] : []}
      </p>
    `
  }
}
