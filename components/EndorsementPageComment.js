const Component = require('./Component')
const stateNames = require('datasets-us-states-abbr-names')

module.exports = class Comment extends Component {
  onclick(event) {
    const endorsed_vote = !(this.state.user && this.state.user.id === this.props.user_id && this.props.comment) && this.props.endorsed_vote
    const vote = endorsed_vote || this.props
    if (~event.currentTarget.className.indexOf('privacy-indicator')) {
      event.preventDefault()
      this.setProps({ showPrivacyIndicator: true }).render(this.props)
    } else if (~event.currentTarget.className.indexOf('delete')) {
      this.setProps({ showPrivacyIndicator: false }).render(this.props)
    } else if (~event.currentTarget.className.indexOf('endorse-btn')) {
      event.preventDefault()
      if (vote.endorsed) {
        return this.unendorse()
      }
      return this.endorse()
    }
  }
  onchange(event) {
    const { user } = this.state
    const endorsed_vote = !(this.state.user && this.state.user.id === this.props.user_id && this.props.comment) && this.props.endorsed_vote
    const { measure_id, short_id, id: vote_id } = endorsed_vote || this.props
    const is_public = event.target.value === 'true'

    return this.api('/rpc/endorse', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id, public: is_public }),
    })
    .then(() => {
      return this.api(`/votes_detailed?measure_id=eq.${measure_id}&id=eq.${vote_id}`)
      .then(([comment]) => {
        this.setState({
          measures: {
            ...this.state.measures,
            [short_id]: {
              ...this.state.measures[short_id],
              comment,
            },
          },
        })
      })
    })
    .catch((error) => {
      console.log(error)
    })
  }

  endorse() {
    const { measures = {}, offices = [], user } = this.state
    const endorsed_vote = !(this.state.user && this.state.user.id === this.props.user_id && this.props.comment) && this.props.endorsed_vote
    const { fullname, measure_id, short_id, id: vote_id, public: is_public } = endorsed_vote || this.props
    const measure = measures[short_id]
    const position = measure && measure.vote_position
    if (!user) {
      this.storage.set('endorsed_vote_id', vote_id)
      this.storage.set('endorsed_measure_id', measure_id)
      this.storage.set('endorsed_url', `/legislation/${short_id}/votes/${vote_id}`)
      return this.location.redirect('/join')
    }
    if (position) {
      let confirmation_text = 'You\'ve already '
      if (measure.cur_endorsement && measure.cur_endorsement.user_id !== user.id) {
        confirmation_text += `endorsed ${this.possessive(measure.cur_endorsement.fullname)} ${position} argument`
      } else if (measure.comment) {
        confirmation_text += `commented. This will remove your previous comment`
      } else {
        confirmation_text += `voted ${position}`
      }
      confirmation_text += `. Endorse ${fullname ? this.possessive(fullname) : 'this'} vote instead?`
      if (!window.confirm(confirmation_text)) {
        return
      }
    }
    return this.api('/rpc/endorse', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id, public: is_public }),
    })
    .then(() => this.fetchMeasure(short_id))
    .then((measure) => {
      this.setState({
        measures: {
          ...measures,
          [short_id]: {
            ...measures[short_id],
            ...measure,
          }
        }
      })
      const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
      const officeId = officesInChamber[0] && officesInChamber[0].id
      return this.fetchConstituentVotes(measure, officeId)
    })
    .then(() => this.fetchTopComments(measure_id, short_id))
    .then(() => this.fetchComments(measure_id, short_id))
    .then(() => this.fetchProxyVotes(measure.id, short_id))
    .then(() => this.api(`/votes_detailed?id=eq.${vote_id}`))
    .then((votes) => {
      if (typeof window === 'object' && window._loq) window._loq.push(['tag', 'Voted'], ['tag', 'Endorsed'])
      this.setState({
        measures: {
          ...measures,
          [short_id]: {
            ...measures[short_id],
            comment: votes[0] || measures[short_id].comment,
          }
        },
        selected_profile: {
          ...this.state.selected_profile,
          public_votes: this.state.selected_profile.public_votes.map((vote) => {
            return vote.id === vote_id ? votes[0] : vote
          })
        },
      })
    })
    .catch((error) => console.log(error))
  }
  unendorse() {
    const { measures = {}, offices = [], user } = this.state
    if (!user) {
      return this.location.redirect('/join')
    }
    if (!window.confirm(`Are you sure you want to remove this endorsement?`)) {
      return
    }
    const endorsed_vote = !(this.state.user && this.state.user.id === this.props.user_id && this.props.comment) && this.props.endorsed_vote
    const { measure_id, short_id, id: vote_id } = endorsed_vote || this.props
    return this.api('/rpc/unendorse', {
      method: 'POST',
      body: JSON.stringify({ vote_id }),
    })
    .then(() => this.fetchMeasure(short_id))
    .then((measure) => {
      this.setState({
        measures: {
          ...measures,
          [short_id]: {
            ...measures[short_id],
            ...measure,
          }
        }
      })
      const officesInChamber = offices.filter(({ chamber }) => chamber === measure.chamber)
      const officeId = officesInChamber[0] && officesInChamber[0].id
      return this.fetchConstituentVotes(measure, officeId)
    })
    .then(() => this.fetchTopComments(measure_id, short_id))
    .then(() => this.fetchComments(measure_id, short_id))
    .then(() => this.fetchProxyVotes(measure_id, short_id))
    .then(() => this.api(`/votes_detailed?id=eq.${vote_id}`))
    .then((votes) => {
      this.setState({
        measures: {
          ...measures,
          [short_id]: {
            ...measures[short_id],
            comment: votes[0] || measures[short_id].comment,
          }
        },
        selected_profile: {
          ...this.state.selected_profile,
          public_votes: this.state.selected_profile.public_votes.map((vote) => {
            return vote.id === vote_id ? votes[0] : vote
          })
        },
      })
    })
    .catch((error) => console.log(error))
  }
  fetchMeasure(short_id) {
    const url = `/measures_detailed?short_id=eq.${short_id}`
    return this.api(url).then((results) => results[0])
  }
  fetchProxyVotes(measure_id, short_id) {
    if (this.state.user) {
      return this.api(`/proxy_votes_detailed?measure_id=eq.${measure_id}&order=proxy_vote_count.desc,created_at.desc`)
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
  fetchConstituentVotes(measure, office_id) {
    const { id, short_id } = measure
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
    return this.api(`/votes_detailed?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.yea&${order}`).then((comments) => {
      const yea = comments[0]

      return this.api(`/votes_detailed?measure_id=eq.${id}&comment=not.is.null&comment=not.eq.&position=eq.nay&${order}`).then((comments) => {
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
    return this.api(`/votes_detailed?measure_id=eq.${measure_id}&comment=not.is.null&comment=not.eq.&order=${orders[order]}${positions[position]}`).then((comments) => {
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
  render() {
    const endorsed_vote = !(this.state.user && this.state.user.id === this.props.user_id && this.props.comment) && this.props.endorsed_vote
    const vote = this.props
    const {
      comment, fullname, id,
      short_id, username, twitter_username
    } = endorsed_vote || vote
    const { measures } = this.state
    const measure = measures && measures[short_id]
    const avatarURL = this.avatarURL(endorsed_vote || vote)
    const anonymousName = measure
      ? `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`
      : 'Anonymous'

    return this.html`
      <div onclick=${this} class="comment">
        <div class="media" style="margin-bottom: 1.5em;">
          <div class="media-left">
            <div class="image is-64x64">
              ${[username || twitter_username
                ? `<a href="/${twitter_username ? `twitter/${twitter_username}` : username}">
                    <img src="${avatarURL}" alt="avatar" class="round-avatar-img" />
                  </a>`
                : `<img src="${avatarURL}" alt="avatar" class="round-avatar-img" />`]}
            </div>
          </div>
          <div class="media-content">
            <div class="has-text-weight-semibold">
              Written by<br/>
              <span class="is-size-5">
                ${username || twitter_username
                    ? [`<a href="/${twitter_username ? `twitter/${twitter_username}` : username}">${fullname}</a>`]
                    : anonymousName}
              </span>
            </div>
          </div>
        </div>
        ${comment ? CommentContent.for(this, { comment }, `comment-context-${id}`) : ''}
      </div>
    `
  }
}

class CommentContent extends Component {
  render({ comment = '' }) {
    return this.html`
      <div class="content is-size-5" style="margin: .25rem 0 .75rem;">
        ${[this.linkifyUrls(comment)]}
      </div>
    `
  }
}
