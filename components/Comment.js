const { WWW_URL } = process.env
const Component = require('./Component')
const timeAgo = require('timeago.js')
const stateNames = require('datasets-us-states-abbr-names')

module.exports = class Comment extends Component {
  onclick(event) {
    if (~event.currentTarget.className.indexOf('endorse')) {
      event.preventDefault()
      if (this.props.endorsed) {
        return this.unendorse()
      }
      return this.endorse()
    }
    if (window.getSelection().toString().length === 0 && event.target.tagName.toUpperCase() !== 'A' && event.target.parentNode.tagName.toUpperCase() !== 'A') {
      event.preventDefault()
      const { author_username, id, short_id, type } = this.props
      const commentUrl = `${author_username ? `/${author_username}/` : '/'}${type === 'PN' ? 'nominations' : 'legislation'}/${short_id}/votes/${id}`
      if (this.location.url !== commentUrl) {
        this.location.redirect(303, commentUrl)
      }
    }
  }
  endorse() {
    const { measures = {}, reps = [], user } = this.state
    const { fullname, short_id, id: vote_id } = this.props
    const measure = measures && measures[short_id]
    const anonymousName = measure
      ? `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`
      : 'Anonymous'
    if (!user) {
      this.storage.set('endorsed_vote_id', vote_id)
      this.storage.set('endorsed_measure_id', measure.id)
      this.storage.set('endorsed_url', `/legislation/${measure.short_id}/votes/${vote_id}`)
      return this.location.redirect('/join')
    }
    if (measure.vote_position) {
      if (!window.confirm(`You've already voted. Endorse ${this.possessive(fullname || anonymousName)} vote instead?`)) {
        return
      }
    }
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id }),
    })
    .then(() => this.fetchMeasure(short_id).then((measure) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            ...measure,
          }
        }
      })
    }))
    .then(() => this.fetchConstituentVotes(measure.id, short_id, officeId))
    .then(() => this.fetchTopComments(measure.id, short_id))
    .then(() => this.fetchComments(measure.id, short_id))
    .then(() => this.api(`/public_votes?id=eq.${vote_id}`))
    .then((votes) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comment: votes[0] || this.state.measures[short_id].comment,
          }
        }
      })
    })
    .catch((error) => console.log(error))
  }
  unendorse() {
    const { measures = {}, reps = [], user } = this.state
    if (!user) {
      return this.location.redirect('/join')
    }
    const { short_id, id: vote_id } = this.props
    const measure = measures[short_id]
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}&vote_id=eq.${vote_id}`, {
      method: 'DELETE',
    })
    .then(() => this.fetchMeasure(short_id).then((measure) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            ...measure,
          }
        }
      })
    }))
    .then(() => this.fetchConstituentVotes(measure.id, short_id, officeId))
    .then(() => this.fetchTopComments(measure.id, short_id))
    .then(() => this.fetchComments(measure.id, short_id))
    .then(() => this.api(`/public_votes?id=eq.${vote_id}`))
    .then((votes) => {
      this.setState({
        measures: {
          ...this.state.measures,
          [short_id]: {
            ...this.state.measures[short_id],
            comment: votes[0] || this.state.measures[short_id].comment,
          }
        }
      })
    })
    .catch((error) => console.log(error))
  }
  fetchMeasure(short_id) {
    const type = ~short_id.indexOf('-pn') ? '&type=eq.PN' : '&or=(type.eq.HR,type.eq.S,type.eq.AB,type.eq.SB)'
    const url = `/measures_detailed?short_id=eq.${short_id}${type}`

    return this.api(url).then((results) => results[0])
  }
  fetchConstituentVotes(id, short_id, office_id) {
    if (office_id) {
      return this.api(`/measure_votes?measure_id=eq.${id}&or=(office_id.eq.${office_id},office_id.is.null)`)
        .then((results) => {
          const votes = results[0] || {}
          this.setState({
            measures: {
              ...this.state.measures,
              [short_id]: {
                ...this.state.measures[short_id],
                ...votes
              },
            },
          })
        })
    }
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
  render() {
    const { comment, author_username, endorsed, updated_at, fullname, id, number, proxy_vote_count, position, show_bill, short_id, title, type, username, user_id, public: is_public } = this.props
    const { measures, selected_profile, user } = this.state
    const measure = measures && measures[short_id]
    const avatarURL = this.avatarURL(this.props)
    const measure_url = `${author_username ? `/${author_username}/` : '/'}${type === 'PN' ? 'nominations' : 'legislation'}/${short_id}`
    const comment_url = `${measure_url}/votes/${id}`
    const share_url = `${WWW_URL}${comment_url}`
    const subject = fullname ? `${fullname} is` : 'People are'
    const measure_title = type && number ? `${type} ${number} — ${title}` : title
    const anonymousName = measure
      ? `${measure.legislature_name === 'U.S. Congress' ? 'American' : (stateNames[measure.legislature_name] || measure.legislature_name)} Resident`
      : 'Anonymous'
    const twitter_measure_title = type && number ? `${type} ${number}` : title
    const twitter_share_text = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${twitter_measure_title}. See why: ${share_url}`
    const tooltip = is_public || !fullname
      ? `This vote is public. Anyone can see it.`
      : user && user.id === user_id
        ? `This is your vote. Only <a href="/proxies/requests">people you've approved</a> will see your identity.`
        : `${fullname} granted you permission to see this vote. Don’t share it publicly.`

    return this.html`
      <div onclick=${this} class="comment">
        <style>
          .comment:not(:last-child) {
            margin-bottom: 1.5rem;
          }
        </style>
        <div class="media">
          ${show_bill && selected_profile
          ? ''
          : [`
              <div class="media-left">
                <div class="image is-32x32">
                  ${username
                    ? `<a href="/${username}">
                        <img src="${avatarURL}" alt="avatar" class="round-avatar-img" />
                      </a>`
                    : `<img src="${avatarURL}" alt="avatar" class="round-avatar-img" />`}
                </div>
              </div>
          `]}
          <div class="media-content" style="${`${show_bill ? '' : `border-left: 1px solid ${position === 'yea' ? 'hsl(141, 71%, 87%)' : 'hsl(348, 100%, 93%)'}; margin-left: -2rem; padding-left: 2rem;`}`}">
            ${[show_bill && selected_profile ? `
              <div>
                <span class="has-text-weight-semibold">${username ? fullname : anonymousName}</span>
                <span>voted <strong>${position}</strong>${proxy_vote_count ? ` on behalf of <span class="has-text-weight-semibold">${proxy_vote_count + 1}</span> people` : ''}</span>
              </div>
              <div style="margin-bottom: .5rem;"><a href="${measure_url}">${measure_title}</a></div>
            ` : `
              <div>
                <span class="has-text-weight-semibold">${username ? [`<a href="/${username}">${fullname}</a>`] : anonymousName}</span>
                <span>voted <strong style="color: ${position === 'yea' ? 'hsl(141, 80%, 38%)' : (position === 'abstain' ? 'default' : 'hsl(348, 80%, 51%)')};">${position}</strong>${proxy_vote_count ? ` on behalf of <span class="has-text-weight-semibold">${proxy_vote_count + 1}</span> people` : ''}</span>
              </div>
            `]}
            ${comment ? [`<div class="content" style="margin: .25rem 0 .75rem;">${this.linkifyUrls(comment)}</div>`] : ''}
            <div style="display: none;" class="notification is-size-7 has-text-centered is-marginless comment-tooltip"><button class="delete"></button>${[tooltip]}</div>
            <div class="is-size-7" style="position: relative;">
              <a class="has-text-grey-light" title="Permalink" href="${share_url}">${timeAgo().format(`${updated_at}Z`)}</a>
              <span class="has-text-grey-light">
                ${user && user.id === user_id ? [`
                  <span class="has-text-grey-lighter">&bullet;</span>
                  <a href="${`${measure_url}?action=add-argument`}" class="has-text-grey-light">
                    <span class="icon is-small"><i class="fas fa-pencil-alt"></i></span>
                    <span>Edit</span>
                  </a>
                `] : ''}
                <span class="has-text-grey-lighter">&bullet;</span>
                <a href="#" onclick=${this} class="has-text-grey-light privacy-indicator">
                  <span class="icon is-small"><i class="${`${is_public || !fullname ? 'fa fa-globe-americas' : 'far fa-address-book'}`}"></i></span>
                  <span>${is_public || !fullname ? 'Public' : 'Private'}</span>
                </a>
                ${is_public || !fullname ? [`
                  <span class="has-text-grey-lighter">&bullet;</span>
                  <a title="Share on Facebook" target="_blank" href="${`https://www.facebook.com/sharer/sharer.php?u=${share_url}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fab fa-facebook"></i></span></a>
                  <a target="_blank" title="Share on Twitter" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" class="has-text-grey-light"><span class="icon is-small"><i class="fab fa-twitter"></i></span></a>
                  <a target="_blank" title="Permalink" href="${comment_url}" class="has-text-grey-light"><span class="icon is-small"><i class="fa fa-link"></i></span></a>
                `] : ''}
                <span class="has-text-grey-lighter">&bullet;</span>
                <a href="#" onclick=${this} class="has-text-weight-bold has-text-grey-light endorse">
                  <span>${endorsed ? 'Endorsed' : 'Endorse'}</span>
                </a>
              </span>
            </div>
          </div>
        </div>
      </div>
    `
  }
}
