const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureDetails = require('./MeasureDetails')
const NotFound = require('./NotFound')

module.exports = class MeasureDetailsPage extends Component {
  oninit() {
    const { config, measures = {}, reps = [] } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    this.setState({
      showMeasureVoteForm: false,
    })

    if (measure) {
      const title = measure.introduced_at ? `${measure.type} ${measure.number} – ${measure.title}` : measure.title
      if (this.isBrowser) {
        const page_title = `${title} | ${config.APP_NAME}`
        window.document.title = page_title
        window.history.replaceState(window.history.state, page_title, document.location)
      }
    } else {
      this.setState({ loading_measure: true })
    }

    return this.fetchMeasure(params.short_id).then((measure) => {
      if (!measure) {
        this.location.setStatus(404)
        return this.setState({ loading_measure: false })
      }

      const title = measure.introduced_at ? `${measure.type} ${measure.number} – ${measure.title}` : measure.title
      if (this.isBrowser) {
        const page_title = `${title} | ${config.APP_NAME}`
        window.document.title = page_title
        window.history.replaceState(window.history.state, page_title, document.location)
      }
      this.setState({
        loading_measure: false,
        showMeasureVoteForm: this.location.query.action === 'add-argument',
        page_title: title,
        page_description: `Vote directly on federal, state, and local bills and nominations. We'll notify your representatives and grade them for how well they listen to their constituents.`,
        selected_bill: measure,
        measures: {
          ...this.state.measures,
          [measure.short_id]: {
            ...(this.state.measures || {})[measure.short_id],
            ...measure,
          }
        },
      })

      const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
      const officeId = repsInChamber[0] && repsInChamber[0].office_id

      return this.fetchComments(measure.id, measure.short_id)
        .then(() => this.fetchConstituentVotes(measure.id, measure.short_id, officeId))
        .then(() => this.fetchTopComments(measure.id, measure.short_id))
        .then(() => this.fetchProxyVotes(measure.id, measure.short_id))
    })
    .catch((error) => {
      console.log(error)
      this.location.setStatus(404)
      return { error, loading_measure: false }
    })
  }
  fetchConstituentVotes(id, short_id, office_id) {
    const measure = this.state.measures[short_id]
    const officeParam = office_id && measure.legislature_name === 'U.S. Congress' ? `&office_id=eq.${office_id}` : '&limit=1'
    return this.api(`/measure_votes?measure_id=eq.${id}${officeParam}`).then((results) => {
      const votes = results[0] || {}
      const measures = this.state.measures || {}
      this.setState({
        measures: {
          ...measures,
          [short_id]: {
            ...measures[short_id],
            ...votes
          },
        },
      })
    })
  }
  fetchTopComments(id, short_id) {
    const order = `order=proxy_vote_count.desc.nullslast,created_at.desc`
    return this.api(`/public_votes?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.yea&${order}`).then((comments) => {
      const yea = comments[0]

      return this.api(`/public_votes?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.nay&${order}`).then((comments) => {
        const nay = comments[0]
        this.setState({
          measures: {
            ...this.state.measures,
            [short_id]: {
              ...this.state.measures[short_id],
              top_yea: yea,
              top_nay: nay,
            },
          },
        })
      })
    })
  }
  fetchMeasure(short_id) {
    const measureUrl = `/${~short_id.indexOf('-pn') ? 'nominations' : 'legislation'}/${short_id}`
    const url = `/measures_detailed?short_id=eq.${short_id}`

    return this.api(url).then((results) => {
      const measure = results[0]
      if (measure && measure.author_id && !this.props.params.username) {
        if (new Date(measure.created_at) > new Date('2018-10-16')) return null
        return this.location.redirect(301, `/${measure.author_username}${measureUrl}`)
      }
      if (!measure || (!measure.author_id && this.props.params.username)) return null
      return measure
    })
  }
  fetchProxyVotes(measure_id, short_id) {
    if (this.state.user) {
      return this.api(`/proxy_votes?measure_id=eq.${measure_id}&order=proxy_vote_count.desc,created_at.desc`)
        .then((proxyVotes) => {
          this.setState({
            measures: {
              ...this.state.measures,
              [short_id]: {
                ...this.state.measures[short_id],
                proxyVotes,
              },
            },
          })
        })
    }
    return Promise.resolve()
  }
  fetchComments(measure_id, short_id) {
    const { query } = this.location
    const order = query.order || 'most_recent'
    const position = query.position || 'all'
    const orders = {
      most_recent: 'created_at.desc',
      vote_power: 'proxy_vote_count.desc.nullslast,created_at.desc',
    }
    const positions = {
      all: '',
      yea: '&position=eq.yea',
      nay: '&position=eq.nay',
    }
    return this.api(`/public_votes?measure_id=eq.${measure_id}&comment=not.is.null&comment=not.eq.&order=${orders[order]}${positions[position]}`).then((comments) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comments,
          },
        },
      })
    })
  }
  onpagechange(oldProps) {
    if (this.props.url !== oldProps.url && this.state.measures) {
      this.oninit()
    }
  }
  render() {
    const { loading_measure, measures = {} } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    return this.html`<div>${
      loading_measure
        ? LoadingIndicator.for(this)
        : measure
          ? MeasureDetails.for(this, { measure })
          : NotFound.for(this)
    }</div>`
  }
}
