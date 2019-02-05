const { WWW_URL } = process.env
const Component = require('./Component')
const timeAgo = require('timeago.js')
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
      comment, author_username, endorsed, updated_at, fullname, id,
      number, proxy_vote_count, position, short_id, title, type,
      username, user_id, public: is_public, shouldTruncate, twitter_username,
      showPrivacyIndicator, source_url, endorsement_public
    } = endorsed_vote || vote
    const { show_bill } = this.props
    const { measures, user } = this.state
    const measure = measures && measures[short_id]
    const avatarURL = this.avatarURL(endorsed_vote || vote)
    const measure_url = `${author_username ? `/${author_username}/` : '/'}${type === 'nomination' ? 'nominations' : 'legislation'}/${short_id}`
    const comment_url = `${measure_url}/votes/${id}`
    const share_url = `${WWW_URL}${comment_url}`
    const measure_title = number ? `${short_id.replace(/^[^-]+-/, '').toUpperCase()} — ${title}` : title
    const anonymousName = measure
      ? `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`
      : 'Anonymous'
    let twitter_share_text = `Good argument! Click to show your support or explain why you disagree. ${share_url}`
    if (user && user.id === user_id) {
      twitter_share_text = `I'm voting ${position}. See why: ${share_url}`
    }
    const tooltip = is_public
      ? `This vote is public. Anyone can see it.`
      : user && user.id === user_id
        ? `This is your vote. It's private, only you can see it.`
        : `${fullname || 'Your proxy'} granted you permission to see this vote. Don’t share it publicly.`
    const onBehalfOfCount = proxy_vote_count

    return this.html`
      <div onclick=${this} class="comment" style="margin-bottom: 1.5em;">
        ${[endorsed_vote ? `<p class="is-size-7 has-text-grey" style="margin-bottom: 1em;">Endorsed by ${!show_bill ? 'your proxy ' : ''}<a href="/${vote.username}">${vote.fullname}</a>:</p>` : '']}
        <div class="media">
          <div class="media-left">
            <div class="image is-32x32">
              ${[username || twitter_username
                ? `<a href="/${twitter_username ? `twitter/${twitter_username}` : username}">
                    <img src="${avatarURL}" alt="avatar" class="round-avatar-img" />
                  </a>`
                : `<img src="${avatarURL}" alt="avatar" class="round-avatar-img" />`]}
            </div>
          </div>
          <div class="media-content" style="${`border-left: 1px solid ${position === 'yea' ? 'hsl(141, 71%, 87%)' : 'hsl(348, 100%, 93%)'}; margin-left: -2rem; padding-left: 2rem;`}">
            <div>
              <span class="has-text-weight-semibold">
                ${!is_public && user && user_id === user.id
                  ? 'You'
                  : username || twitter_username
                    ? [`<a href="/${twitter_username ? `twitter/${twitter_username}` : username}">${fullname}</a>`]
                    : anonymousName}
              </span>
              ${[`<span>voted <strong style="color: ${position === 'yea' ? 'hsl(141, 80%, 38%)' : (position === 'abstain' ? 'default' : 'hsl(348, 80%, 51%)')};">${position}</strong>${onBehalfOfCount > 1 && is_public ? ` on behalf of <span class="has-text-weight-semibold">${onBehalfOfCount}</span> people` : ''}${is_public ? '' : ' privately'}</span>`]}
              ${source_url ? [`<span class="is-size-7"> via <a href="${source_url}" target="_blank">${source_url.split('/')[2] || source_url}</a></span>`] : ''}
            </div>
            ${[show_bill ? `<div style="margin-bottom: .5rem;"><a href="${measure_url}">${measure_title}</a></div>` : '']}
            ${comment ? CommentContent.for(this, { comment, shouldTruncate }, `comment-context-${id}`) : ''}
            <div class="${`notification is-size-7 has-text-centered comment-tooltip ${showPrivacyIndicator ? '' : 'is-hidden'}`}"><button onclick=${this} class="delete"></button>${[tooltip]}</div>
            <div class="${`${!is_public ? 'is-hidden' : ''} endorse-control is-size-7`}">
              <a href="#" onclick=${this} class="${`endorse-btn has-text-weight-semibold has-text-grey button is-small ${endorsed ? 'is-light' : ''}`}">
                <span>${endorsed ? 'Endorsed' : 'Endorse'}</span>
              </a>
              <div class="${`select ${endorsed ? '' : 'is-hidden'}`}">
                <select name="public" onchange=${this} class="has-text-grey is-light">
                  <option selected=${endorsement_public} value="true">Public${measure && measure.vote_power ? ` (Vote Power: ${measure.vote_power || 1})` : ''}</option>
                  <option selected=${!endorsement_public} value="false">Private${measure && measure.vote_power ? ` (Vote Power: 1)` : ''}</option>
                </select>
              </div>
            </div>
            <div class="is-size-7" style="position: relative; line-height: 25px; margin-top: 0.2rem;">
              <a class="has-text-grey-light" title="Permalink" href="${share_url}">${timeAgo().format(`${updated_at}Z`)}</a>
              <span class="has-text-grey-light">
                ${user && user.id === user_id ? [`
                  <span class="has-text-grey-lighter">&bullet;</span>
                  <a href="${`${measure_url}/vote`}" class="has-text-grey-light">
                    <span class="icon is-small"><i class="fas fa-pencil-alt"></i></span>
                    <span>Edit</span>
                  </a>
                `] : [`
                `]
              }
                ${is_public || !fullname ? [`
                  <span class="has-text-grey-lighter">&bullet;</span>
                  <a title="Share on Facebook" target="_blank" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fab fa-facebook"></i></span></a>
                  <a target="_blank" title="Share on Twitter" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fab fa-twitter"></i></span></a>
                  <a target="_blank" title="Permalink" href="${share_url}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-link"></i></span></a>
                `] : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    `
  }
}

class CommentContent extends Component {
  onclick(event) {
    event.preventDefault()
    this.setProps({ expanded: !this.props.expanded }).render(this.props)
  }
  breakOnWord(str) {
    let len = 0
    const truncated = str.split('\n').reduce((memo, line, index) => {
      if (len > 300) return memo
      len += 1
      const words = line.split(' ').reduce((memo2, word) => {
        if (len > 300) return memo2
        len += word.length + 1
        return `${memo2} ${word}`
      }, '')
      // Workaround for callback never called if initialValue is falsey.
      if (index === 0) { return words }
      return `${memo}\n${words}`
    }, 'see comment about initialValue workaround')
    if (str.length > truncated.length) {
      return `${truncated}...`
    }
    return truncated
  }
  render({ comment = '', expanded = false, shouldTruncate = true }) {
    const showExpander = shouldTruncate && comment.length > 300
    return this.html`
      <div class="content" style="margin: .25rem 0 .75rem;">
        ${[this.linkifyUrls(expanded || !showExpander ? comment : this.breakOnWord(comment))]}
        <span class="${showExpander ? '' : 'is-hidden'}">
          <a href="#" onclick=${this} class="is-size-7">
            <span>show ${expanded ? 'less' : 'more'}</span>
          </a>
        </span>
      </div>
    `
  }
}
