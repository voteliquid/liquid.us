const Component = require('./Component')
const LoadingIndicator = require('./LoadingIndicator')
const MeasureDetails = require('./MeasureDetails')
const NotFound = require('./NotFound')

module.exports = class MeasureDetailsPage extends Component {
  oninit() {
    const { config, measures = {}, user } = this.state
    const { params } = this.props
    const measure = measures[params.short_id]

    if (measure) {
      const title = measure.introduced_at ? `${measure.type} ${measure.number} – ${measure.title}` : measure.title
      if (this.isBrowser) {
        const page_title = `${title} ★ ${config.APP_NAME}`
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
        const page_title = `${title} ★ ${config.APP_NAME}`
        window.document.title = page_title
        window.history.replaceState(window.history.state, page_title, document.location)
      }
      this.setState({
        loading_measure: false,
        page_title: title,
        page_description: `Vote directly on federal bills and nominations. We'll notify your representatives and grade them for how well they listen to their constituents.`,
        measures: {
          ...this.state.measures,
          [measure.short_id]: {
            ...(this.state.measures || {})[measure.short_id],
            ...measure,
          }
        },
      })

      return this.fetchComments(measure.id, measure.short_id)
        .then(() => this.fetchTopComments(measure.id, measure.short_id))
        .then(() => this.fetchProxyVotes(measure.id, measure.short_id, user))
    })
    .catch((error) => {
      console.log(error)
      this.location.setStatus(404)
      return { error, loading_measure: false }
    })
  }
  fetchTopComments(id, short_id) {
    return this.api(`/public_votes?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.yea`).then((comments) => {
      const yea = comments[0]

      return this.api(`/public_votes?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.nay&order=proxy_vote_count.desc,created_at.desc`).then((comments) => {
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
    const type = ~short_id.indexOf('-pn') ? '&type=eq.PN' : '&or=(type.eq.HR,type.eq.S)'
    const url = `/measures_detailed?short_id=eq.${short_id}${type}`

    return this.api(url).then((results) => results[0])
  }
  fetchProxyVotes(measure_id, short_id, user) {
    if (user) {
      return this.api(`/delegations_detailed?from_id=eq.${user.id}&order=delegate_rank.asc`)
        .then((proxies) => {
          const proxyIds = proxies.map(({ to_id }) => to_id)
          return this.api(`/public_votes?measure_id=eq.${measure_id}&user_id=in.(${proxyIds.join(',')})&order=proxy_vote_count.desc,created_at.desc`)
        })
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
  }
  fetchComments(measure_id, short_id) {
    const { query } = this.location
    const order = query.order || 'most_recent'
    const position = query.position || 'all'
    const orders = {
      most_recent: 'updated_at.desc',
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
