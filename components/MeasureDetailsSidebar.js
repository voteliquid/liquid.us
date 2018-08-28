const Component = require('./Component')
const EditButtons = require('./EditMeasureButtons')
const MeasureShareButtons = require('./MeasureShareButtons')

module.exports = class MeasureDetailsSidebar extends Component {
  render() {
    const l = this.props
    const { user } = this.props
    const reps = (this.state.reps || []).filter(({ office_chamber }) => office_chamber === l.chamber)
    const showStatusTracker = l.legislature_name === 'U.S. Congress' && l.introduced_at && (l.type === 'HR' || l.type === 'S')

    return this.html`
      <div>
        <nav class="panel">
          <h3 class="panel-heading has-text-centered has-text-weight-semibold">${l.introduced_at ? `${l.type} ${l.number}` : 'Proposed'}</h3>
          ${reps && reps.length ? MeasureRepsPanel.for(this, { measure: l, reps }) : ''}
          ${MeasureVotesPanel.for(this, { measure: l })}
          ${MeasureInfoPanel.for(this, { measure: l })}
          ${showStatusTracker ? MeasureStatusPanel.for(this, { measure: l }) : ''}
          ${MeasureActionsPanel.for(this, { measure: l, user })}
        </nav>
      </div>
    `
  }
}

class MeasureActionsPanel extends Component {
  render() {
    const { measure: l, user } = this.props
    return this.html`
      <div class="panel-block is-size-7" style="justify-content: center;">
        ${user && user.id === l.author_id ? EditButtons.for(this, l) : MeasureShareButtons.for(this, l)}
      </div>
    `
  }
}

class MeasureStatusPanel extends Component {
  render() {
    const { measure: l } = this.props
    const steps = [{ step: 'Introduced', fulfilled: !!l.introduced_at }]

    if (l.chamber === 'Upper') {
      steps.push({ step: 'Passed Senate', fulfilled: !!l.passed_upper_at })
      steps.push({ step: 'Passed House', fulfilled: !!l.passed_lower_at })
    } else {
      steps.push({ step: 'Passed House', fulfilled: !!l.passed_lower_at })
      steps.push({ step: 'Passed Senate', fulfilled: !!l.passed_upper_at })
    }

    steps.push({ step: 'Enacted', fulfilled: !!l.enacted_at })

    return this.html`
      <div class="panel-block">
        <div>
          <ul>
            ${steps.map(({ fulfilled, step }) => {
              return `<li class="${`step ${fulfilled ? 'fulfilled' : 'has-text-grey'}`}"><span class="icon"><i class="fa ${fulfilled ? 'fa-check-circle-o' : 'fa-circle-o'}"></i></span>${step}</li>`
            })}
          </ul>
        </div>
      </div>
    `
  }
}

class MeasureInfoPanel extends Component {
  render() {
    const { measure } = this.props
    const {
      introduced_at, created_at, author_username, sponsor_username,
      sponsor_first_name, sponsor_last_name, author_first_name,
      author_last_name, type, number, congress, chamber, legislature_name
    } = measure

    let bill_details_name = false
    let bill_details_url = false

    if (introduced_at) {
      if (legislature_name === 'U.S. Congress') {
        bill_details_name = 'congress.gov'
        if (type === 'HR' || type === 'S') {
          bill_details_url = `https://www.congress.gov/bill/${congress}th-congress/${chamber === 'Lower' ? 'house' : 'senate'}-bill/${number}`
        } else if (type === 'PN') {
          bill_details_url = `https://www.congress.gov/nomination/${congress}th-congress/${number}`
        }
        if (legislature_name === 'California') {
          bill_details_name = 'leginfo.legislature.ca.gov'
          bill_details_url = `https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=${congress}0${type}${number}`
        }
      }
    }
    return this.html`
      <div class="panel-block">
        <div class="columns is-gapless is-multiline is-mobile">
          <div class="column is-one-third">
            <div class="has-text-grey">${introduced_at ? 'Introduced' : 'Proposed'}</div>
          </div>
          <div class="column is-two-thirds">
            <div class="has-text-right">${new Date(introduced_at || created_at).toLocaleDateString()}</div>
          </div>
          <div class="column is-one-third">
            <div class="has-text-grey">${author_username ? 'Author' : (sponsor_username ? 'Sponsor' : '')}</div>
          </div>
          <div class="column is-two-thirds">
            <div class="has-text-right">
              ${sponsor_username
                ? [`<a href="/${sponsor_username}">${sponsor_first_name} ${sponsor_last_name}</a>`]
                : author_username
                  ? [`<a href="/${author_username}">${author_first_name} ${author_last_name}</a>`]
                  : ''}
            </div>
          </div>
          ${bill_details_url ? [`
            <div class="column is-one-third"><div class="has-text-grey">Bill text</div></div>
            <div class="column is-two-thirds">
              <div class="has-text-right">
                <a href="${bill_details_url}">${bill_details_name}</a>
              </div>
            </div>
          `] : ''}
        </div>
      </div>
    `
  }
}

class MeasureVotesPanel extends Component {
  render() {
    const { APP_NAME } = this.state.config
    const { measure } = this.props
    const { yeas, nays } = measure
    return this.html`
      <div class="panel-block">
        <div style="width: 100%;">
          <div class="columns is-gapless is-marginless is-mobile">
            <div class="column is-half">
              <div class="has-text-left has-text-grey">${APP_NAME} Votes</div>
            </div>
            <div class="column is-half has-text-right has-text-grey">
              <span>${yeas}</span>
              <span class="is-size-7">Yeas</span>
              <span>${nays}</span>
              <span class="is-size-7">Nays</span>
            </div>
          </div>
          <div style="background-color: hsl(0, 0%, 86%); margin: .5rem 0; position: relative; border-radius: 2px; height: 6px; overflow: hidden;">
            <div style="${`position: absolute; top: 0; bottom: 0; left: 0; width: ${(yeas / (yeas + nays)) * 100}%; background-color: hsl(141, 71%, 48%);`}"></div>
            <div style="${`position: absolute; top: 0; bottom: 0; left: ${(yeas / (yeas + nays)) * 100}%; width: ${(nays / (yeas + nays)) * 100}%; background-color: hsl(348, 100%, 61%);`}"></div>
          </div>
        </div>
      </div>
    `
  }
}

class VoteButton extends Component {
  votePositionClass() {
    const { vote_position: position } = this.props
    if (position === 'yea') return 'is-success'
    if (position === 'nay') return 'is-danger'
    return ''
  }
  render() {
    const s = this.props

    let voteBtnTxt = 'Vote'
    let voteBtnClass = 'button is-primary is-fullwidth'
    let voteBtnIcon = 'fa fa-pencil-square-o'

    if (s.vote_position) {
      const position = `${s.vote_position[0].toUpperCase()}${s.vote_position.slice(1)}`
      if (s.vote_position === 'yea') voteBtnIcon = 'fa fa-check'
      if (s.vote_position === 'nay') voteBtnIcon = 'fa fa-times'
      if (s.vote_position === 'abstain') voteBtnIcon = 'fa fa-circle-o'
      if (s.delegate_rank > -1) {
        if (s.delegate_name) {
          voteBtnTxt = `Inherited ${position} vote from ${s.delegate_name}`
        } else {
          voteBtnTxt = `Inherited ${position} vote from proxy`
        }
        voteBtnClass = `button is-outlined is-fullwidth ${this.votePositionClass()}`
      }
      if (s.delegate_rank === -1) {
        voteBtnTxt = `You voted ${position}`
        voteBtnClass = `button is-fullwidth ${this.votePositionClass()}`
      }
    }
    return this.html`
      <a style="height: auto; white-space: normal; align-items: flex-start; margin-bottom: .5rem;" class=${voteBtnClass} href=${`/${s.type === 'PN' ? 'nominations' : 'legislation'}/${s.short_id}/vote`}>
        <span class="icon"><i class=${voteBtnIcon}></i></span>
        <span class="has-text-weight-semibold">${voteBtnTxt}</span>
      </a>
    `
  }
}

class MeasureRepsPanel extends Component {
  render() {
    const { measure, reps = [] } = this.props
    const officeName = reps[0] && reps[0].office_short_name
    return this.html`
      <div class="panel-block">
        <div>
          ${measure.vote_position ? VoteButton.for(this, measure) : ''}
          <h4 class="has-text-centered has-text-weight-semibold" style="margin: 0 0 .5rem;">
            ${measure.vote_position
            ? `We told your rep${reps.length > 1 ? 's' : ''} in ${officeName}`
            : `Vote to tell your rep${reps.length > 1 ? 's' : ''} in ${officeName}`}
          </h4>
          ${reps.map((rep) => RepSnippet.for(this, { rep }, `sidebar-rep-${rep.user_id}`))}
        </div>
      </div>
    `
  }
}

class RepSnippet extends Component {
  render() {
    const { rep } = this.props
    return this.html`
      <div>
        <div class="media" style="margin-bottom: .5rem;">
          <figure class="media-left" style="overflow: hidden; border-radius: 5px;">
            <p class="image is-64x64">
              <a href=${`/${rep.username}`}>
                <img src=${this.avatarURL(rep)} />
              </a>
            </p>
          </figure>
          <div class="media-content">
            <a href=${`/${rep.username}`}>
              <strong>${rep.first_name} ${rep.last_name}</strong>
            </a>
            <p class="is-size-7">${rep.office_name}</p>
          </div>
        </div>
      </div>
    `
  }
}
