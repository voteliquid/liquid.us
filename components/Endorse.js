const Component = require('./Component')
const possessive = require('./Component').prototype.possessive
const { fetchConstituentVotes } = require('./MeasureDetailsPage').prototype

module.exports = class Endorse extends Component {
  render() {
    const { user, vote, vote_position } = this.props
    return this.html`
      <div>
        ${user && user.id === vote.user_id
          ? YourVote.for(this, vote)
          : vote_position
            ? vote.endorsed
              ? Endorsed.for(this, vote)
              : AlreadyVoted.for(this, { vote, vote_position })
            : Unendorsed.for(this, vote)}
      </div>
    `
  }
}

class VoteShareButtons extends Component {
  onclick(event) {
    event.preventDefault()
    document.querySelector('.copy2clipboard').select()
    document.execCommand('copy')
    this.setProps({ copied2clipboard: true }).render()
    setTimeout(() => this.setProps({ copied2clipboard: false }).render(), 2000)
  }
  render() {
    const { user } = this.state
    const { copied2clipboard, position, title, short_id, id, user_id, fullname, number, type } = this.props
    const subject = fullname ? `${fullname} is` : 'People are'
    const comment_url = type === 'PN' ? `/nominations/${short_id}/votes/${id}` : `/legislation/${short_id}/votes/${id}`
    const twitter_measure_title = type && number ? `${type} ${number}` : title
    const twitter_share_text = `${user && user.id === user_id ? `I'm` : subject} voting ${position === 'yea' ? 'in favor' : 'against'} ${twitter_measure_title}. See why: ${comment_url}`
    return this.html`
      <div style="margin: .5rem 0;">
        <a class="is-small" href="${`https://twitter.com/intent/tweet?text=${twitter_share_text}`}" title="Share on Twitter">
          <span class="icon"><i class="fab fa-twitter"></i></span><span>Twitter</span>
        </a>
        <a class="is-small" href="${`https://www.facebook.com/sharer/sharer.php?u=${comment_url}`}" title="Share on Facebook">
          <span class="icon"><i class="fab fa-facebook"></i></span><span>Facebook</span>
        </a>
        <link rel="stylesheet" href="/assets/bulma-tooltip.min.css">
        <a
          class="${`tooltip is-small ${copied2clipboard ? 'is-tooltip-active is-tooltip-info' : ''}`}"
          data-tooltip="${copied2clipboard ? 'Copied URL to clipboard' : 'Copy URL to clipboard'}"
          href="${comment_url}"
          title="Permalink"
          onclick=${this}
        >
          <span class="icon"><i class="fa fa-link"></i></span><span>Permalink</span>
        </a>
        <textarea class="copy2clipboard" style="position: absolute; left: -9999px;" readonly>${comment_url}</textarea>
      </div>
    `
  }
}

class Endorsed extends Component {
  onclick(event) {
    event.preventDefault()
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
    .then(() => fetchConstituentVotes.call(this, measure.id, short_id, officeId))
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
  render() {
    const { fullname, username } = this.props
    return this.html`
      <div class="box" style="max-width: 600px;">
        <div class="level">
          <div class="level-left">
            <div class="has-text-centered has-text-left-mobile">
              <p class="has-text-left">
                Share ${possessive(fullname && username ? fullname : 'Anonymous')} position to build support.
              </p>
              ${VoteShareButtons.for(this, this.props)}
            </div>
          </div>
          <div class="level-right">
            <a onclick=${this} href="#" class="button is-primary">
              <span>Endorsed</span>
            </a>
          </div>
        </div>
      </div>
    `
  }
}

class Unendorsed extends Component {
  onclick(event) {
    event.preventDefault()
    const { measures = {}, reps = [], user } = this.state
    if (!user) {
      return this.location.redirect('/join')
    }
    const { short_id, id: vote_id } = this.props
    const measure = measures[short_id]
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id }),
    })
    .then(() => fetchConstituentVotes.call(this, measure.id, short_id, officeId))
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
  render() {
    const { fullname, username } = this.props
    return this.html`
      <div class="box" style="max-width: 600px;">
        <div class="level">
          <div class="level-left">
            <p class="has-text-left">
              You haven't voted on this bill.<br />Let your reps know you agree with ${fullname && username ? fullname : 'Anonymous'}.
            </p>
          </div>
          <div class="level-right">
            <a onclick=${this} href="#" class="button is-primary">
              <span>Endorse</span>
            </a>
          </div>
        </div>
      </div>
    `
  }
}

class AlreadyVoted extends Component {
  onclick(event) {
    event.preventDefault()
    const { measures = {}, reps = [], user } = this.state
    if (!user) {
      return this.location.redirect('/join')
    }
    const { short_id, id: vote_id } = this.props.vote
    const measure = measures[short_id]
    const repsInChamber = reps.filter(({ office_chamber }) => office_chamber === measure.chamber)
    const officeId = repsInChamber[0] && repsInChamber[0].office_id
    return this.api(`/endorsements?user_id=eq.${user.id}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, vote_id, measure_id: measure.id }),
    })
    .then(() => fetchConstituentVotes.call(this, measure.id, short_id, officeId))
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
  render() {
    const { vote, vote_position } = this.props
    const { fullname, username } = vote
    return this.html`
      <div class="box" style="max-width: 600px;">
        <div class="level">
          <div class="level-left">
            <p class="has-text-left">
              You already voted ${this.capitalize(vote_position)} on this bill.<br />Endorse ${possessive(fullname && username ? fullname : 'Anonymous')} position instead?
            </p>
          </div>
          <div class="level-right">
            <a onclick=${this} href="#" class="button is-primary">
              <span>Endorse</span>
            </a>
          </div>
        </div>
      </div>
    `
  }
}

class YourVote extends Component {
  render() {
    return this.html`
      <div class="box" style="max-width: 600px;">
        <div class="level">
          <div class="level-left">
            <div class="has-text-centered has-text-left-mobile">
              <p class="has-text-left">
                Encourage others to endorse your position.
              </p>
              ${VoteShareButtons.for(this, this.props)}
            </div>
          </div>
        </div>
      </div>
    `
  }
}
