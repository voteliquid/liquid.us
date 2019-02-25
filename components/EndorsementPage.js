const { APP_NAME, ASSETS_URL } = process.env
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
    const { measures = {}, offices = [], user } = this.state
    const { params } = this.props

    if (!measures[params.short_id] || !measures[params.short_id].comment) {
      this.setState({ loading_measure: true })
    }

    const fetchMeasure = this.api(`/measures_detailed?short_id=eq.${params.short_id}`).then((measures) => measures[0])
    const fetchComment = this.fetchComment(params.comment_id)

    return Promise.all([fetchMeasure, fetchComment]).then(([measure, comment]) => {
      if (!measure || !comment) {
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

      this.setPageTitleAndDesc(measure, comment)

      this.setState({
        loading_measure: false,
        measures: {
          ...this.state.measures,
          [measure.short_id]: {
            ...measure,
            comment,
          },
        },
      })

      const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
      const officeId = officesInChamber[0] && officesInChamber[0].id
<<<<<<< HEAD
      return fetchConstituentVotes.call(this, measure, officeId).then(() => {
        return this.fetchComment(params.comment_id, measure).then(comment => {
          return this.fetchEndorsementComments(comment).then((replies) => {
            return this.fetchEndorsementComment(comment, measure, user).then((reply) => {
              if (!comment) {
                this.location.setStatus(404)
                return this.setState({ loading_measure: false })
              }

              measure.comment = comment
              measure.reply = reply
              measure.replies = replies || []
              const isCity = measure.legislature_name.includes(',')

              const anonymousName = `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`

              let legislature = `${measure.legislature_name}`
              if (measure.legislature_name === 'U.S. Congress') {
                legislature = 'Congress'
              } else if (isCity) {
                legislature = `${measure.legislature_name}`
              }

              const page_title = `${comment.fullname || anonymousName}: ${comment.position === 'nay' ? 'Oppose ' : 'Support'} '${measure.title}' in ${legislature}`
              if (this.isBrowser) {
                const page_title_with_appname = `${page_title} | ${config.APP_NAME}`
                window.document.title = page_title_with_appname
                window.history.replaceState(window.history.state, page_title_with_appname, document.location)
              }
              let theLegislature = `the ${measure.legislature_name} legislature`
              if (measure.legislature_name === 'U.S. Congress') {
                theLegislature = 'Congress'
              } else if (isCity) {
                theLegislature = `the City of ${measure.legislature_name}`
              }

              const inlineImageMatch = comment && comment.comment.match(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif)\b/i)
              const inlineImage = inlineImageMatch && inlineImageMatch[0]
              const measureImage = (!isCity) ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
              const authorImage = comment.username || comment.twitter_username ? this.avatarURL(comment) : null
              const ogImage = inlineImage || authorImage || measureImage

              this.fetchLastVotePublic().then(() => {
                this.setState({
                  loading_measure: false,
                  page_title: measure.title,
                  page_description: `${comment.fullname} to ${theLegislature}: ${this.escapeHtml(comment.comment, { replaceAmp: true, stripImages: true })}`,
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
        })
      })
=======

      Promise.all([
        fetchConstituentVotes.call(this, measure, officeId),
        this.fetchEndorsementComments(comment, params.short_id),
        this.fetchEndorsementComment(comment, params.short_id, user),
        this.fetchLastVotePublic(),
      ])
>>>>>>> 69fa3f9ce317c4c7ad3a59a3be589cf2393fd75f
    })
    .catch((error) => {
      console.log(error)
      this.location.setStatus(404)
      return this.setState({ error, loading_measure: false })
    })
  }
  setPageTitleAndDesc(measure, comment) {
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
      const page_title_with_appname = `${page_title} | ${APP_NAME}`
      window.document.title = page_title_with_appname
      window.history.replaceState(window.history.state, page_title_with_appname, document.location)
    }

    const inlineImageMatch = comment && comment.comment.match(/\bhttps?:\/\/\S+\.(png|jpg|jpeg|gif)\b/i)
    const inlineImage = inlineImageMatch && inlineImageMatch[0]
    const measureImage = (!isCity) ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
    const authorImage = comment.username || comment.twitter_username ? this.avatarURL(comment) : null
    const ogImage = inlineImage || authorImage || measureImage

    this.setState({
      page_title,
      page_description: this.escapeHtml(comment.comment, { replaceAmp: true, stripImages: true }),
      og_image_url: ogImage,
    })
  }
  fetchEndorsementComment(comment, short_id, user) {
    const vote_id = comment.id
    const user_id = user && user.id
    if (user_id) {
      return this.api(`/replies?vote_id=eq.${vote_id}&user_id=eq.${user_id}`).then((replies) => {
        this.setState({
          measures: {
            ...this.state.measures,
            [short_id]: {
              ...this.state.measures[short_id],
              reply: replies[0],
              replyLoaded: true,
            },
          },
        })
      })
    }
    return Promise.resolve(null)
  }
  fetchEndorsementComments(comment, short_id) {
    const vote_id = comment.id
    return this.api(`/replies_detailed?vote_id=eq.${vote_id}&author_name=not.is.null&order=created_at.desc`).then((replies) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            replies,
          },
        },
      })
    })
  }
  fetchComment(id) {
    return this.api(`/votes_detailed?id=eq.${id}`).then(([comment]) => (comment))
  }
  fetchLastVotePublic() {
    const { user } = this.state
    if (user) {
      return this.api(`/votes?user_id=eq.${user.id}&delegate_rank=eq.-1&order=updated_at.desc&limit=1`).then(votes => {
        const last_vote_public = votes[0] ? votes[0].public : true
        this.setState({ last_vote_public })
      })
    }
    return Promise.resolve()
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
              ${l.author_username === 'councilmemberbas' ? '' : TargetReps.for(this, { measure: l })}
              <div class="small-screens-only">
                ${EndorsementCount.for(this, { measure: l })}
              </div>
              <br />
              ${EndorsementPageComment.for(this, { ...l.comment, shouldTruncate: false })}
              <div style="border-left: 2px solid hsl(0, 0%, 60%); padding-left: 2rem; margin-top: 2rem;">
                ${MeasureSummary.for(this, { measure: l, expanded: true, size: 5 }, `endorsement-${l.comment.id}`)}
              </div>
              <div class="small-screens-only">
                ${MobileHoverBar.for(this, { measure: l, user, onclick: this.triggerMobileForm.bind(this) })}
              </div>
              ${MobileForm.for(this, { ...l, user, visible: mobileFormVisible, onclick: this.triggerMobileForm.bind(this) })}
              ${(l.replies || []).map((reply) => EndorsementComment.for(this, reply, `endorsement-${l.id}-${reply.id}`))}
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
                @media (min-width: 1050px) {
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
    if (measure.comment.position === 'abstain') { action = 'Weigh in'; color = 'is-success' }
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
      <div class="columns">
        <div class="column is-narrow" style="margin-bottom: -1rem">
          <span class="is-size-3 is-size-4-mobile has-text-weight-semibold">To:&nbsp;</span>
        </div>
        ${targetReps.map(r => Rep.for(this, { r }, `rep-${r.id}`))}
        ${Legislature.for(this, { measure, targetReps })}
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
    const isState = r.legislature.name !== 'U.S. Congress'
    const firstLine = isState
      ? `${rep.first_name} ${rep.last_name}, ${r.legislature.short_name}`
      : `${r.chamber === 'Upper' ? 'Sen' : 'Rep'}. ${rep.first_name} ${rep.last_name}`
    const secondLine = isState
      ? position
      : r.chamber === 'Upper' ? stateNames[r.short_name] : r.short_name

    return this.html`
      <div class="column is-narrow">
        <div class="media">
          <div class="media-left">
            <div class="image is-48x48 is-clipped">
              <img src=${this.avatarURL(rep)} />
            </div>
          </div>
          <div class="media-content has-text-weight-semibold is-size-5" style="line-height: 24px;">
            ${firstLine}<br />
            ${secondLine}
          </div>
        </div>
      </div>
    `
  }
}

class Legislature extends Component {
  render() {
    const { measure } = this.props
    const isState = measure.legislature_name.length === 2
    const measureImage = isState ? `${ASSETS_URL}/legislature-images/${measure.legislature_name}.png` : ''
    const name = isState ? stateNames[measure.legislature_name] : measure.legislature_name

    return this.html`
      <div class="column">
        <div class="media">
          ${isState ? [`
            <div class="media-left">
              <div class="image is-48x48 is-clipped">
                <img src=${measureImage} style="background: hsla(0, 0%, 87%, 0.5); padding: 4px;"/>
              </div>
            </div>
          `] : []}
          <div class="media-content has-text-weight-semibold is-size-5" style="line-height: 24px;">
            ${name}<br />
            ${measure.legislature_name === 'U.S. Congress' ? '' : 'Legislature'}
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
    if (measure.comment.position === 'abstain') { action = 'Weigh in' }

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

class EndorsementComment extends Component {
  render() {
    const { content, author_gravatar, author_name, author_username } = this.props
    return this.html`
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32">
            <img src="${`https://www.gravatar.com/avatar/${author_gravatar}?d=mm&s=200`}" class="round-avatar-img" />
          </div>
        </div>
        <div class="media-content">
          <p class="has-text-weight-semibold">
            ${[author_username
              ? `<a href="/${author_username}">${author_name}</a>`
              : (author_name || 'Anonymous')]}
          </p>
          <p>${content}</p>
        </div>
      </div>
    `
  }
}
