const Component = require('./Component')
const EditButtons = require('./EditMeasureButtons')
const MeasureShareButtons = require('./MeasureShareButtons')
const ordinalSuffix = require('ordinal-suffix')

module.exports = class MeasureDetailsSidebar extends Component {
  render() {
    const l = this.props
    const { reps } = this.state
    const { user } = this.props
    const steps = [{ step: 'Introduced', fulfilled: !!l.introduced_at }]
    const show_tracker = l.legislature_name === 'U.S. Congress' && l.introduced_at && (l.type === 'HR' || l.type === 'S')

    let bill_details_name = false
    let bill_details_url = false

    if (l.introduced_at) {
      if (l.legislature_name === 'U.S. Congress') {
        bill_details_name = 'congress.gov'
        if (l.type === 'HR' || l.type === 'S') {
          bill_details_url = `https://www.congress.gov/bill/${l.congress}th-congress/${l.chamber === 'Lower' ? 'house' : 'senate'}-bill/${l.number}`
        } else if (l.type === 'PN') {
          bill_details_url = `https://www.congress.gov/nomination/${l.congress}th-congress/${l.number}`
        }
        if (l.legislature_name === 'California') {
          bill_details_name = 'leginfo.legislature.ca.gov'
          bill_details_url = `https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=${l.congress}0${l.type}${l.number}`
        }
      }
    }

    if (l.chamber === 'Upper') {
      steps.push({ step: 'Passed Senate', fulfilled: !!l.passed_upper_at })
      steps.push({ step: 'Passed House', fulfilled: !!l.passed_lower_at })
    } else {
      steps.push({ step: 'Passed House', fulfilled: !!l.passed_lower_at })
      steps.push({ step: 'Passed Senate', fulfilled: !!l.passed_upper_at })
    }

    steps.push({ step: 'Enacted', fulfilled: !!l.enacted_at })

    return this.html`
      <div>
        <nav class="panel">
          <h3 class="panel-heading has-text-centered has-text-weight-semibold">${l.introduced_at ? `${l.type} ${l.number}` : 'Proposed'}</h3>
          <div class="panel-block has-text-centered">
            <div style="width: 100%;">
              <div style="margin-bottom: .75rem;">${VoteButton.for(this, l, `votebutton-${l.id}`)}</div>
              ${VoteStats.for(this, l, `votestats-${l.id}`)}
            </div>
          </div>
          <div class="panel-block">
            <dl class="columns is-gapless is-multiline">
              <div class="column is-one-third">
                  <dt class="has-text-weight-semibold">${l.introduced_at ? 'Introduced' : 'Proposed'}</dt>
              </div>
              <div class="column is-two-thirds">
                <dd class="has-text-right has-text-left-mobile">${new Date(l.introduced_at || l.created_at).toLocaleDateString()}</dd>
              </div>
              <div class="column is-one-third">
                <dt class="has-text-weight-semibold">${l.author_username ? 'Author' : (l.sponsor_username ? 'Sponsor' : '')}</dt>
              </div>
              <div class="column is-two-thirds">
                <dd class="has-text-right has-text-left-mobile">
                  ${l.sponsor_username
                    ? [`<a href="/${l.sponsor_username}">${l.sponsor_first_name} ${l.sponsor_last_name}</a>`]
                    : l.author_username
                      ? [`<a href="/${l.author_username}">${l.author_first_name} ${l.author_last_name}</a>`]
                      : ''}
                </dd>
              </div>
              ${bill_details_url ? [`
                <div class="column is-one-third"><dt class="has-text-weight-semibold">Bill text</dt></div>
                <div class="column is-two-thirds">
                  <dd class="has-text-right has-text-left-mobile">
                    <a href="${bill_details_url}">${bill_details_name}</a>
                  </dd>
                </div>
              `] : ''}
            </dl>
          </div>
          ${show_tracker ? [`
          <div class="panel-block">
            <div>
              <ul>
                ${steps.map(({ fulfilled, step }) => {
                  return `<li class="${`step ${fulfilled ? 'fulfilled' : 'has-text-grey'}`}"><span class="icon"><i class="fa ${fulfilled ? 'fa-check-circle-o' : 'fa-circle-o'}"></i></span>${step}</li>`
                }).join('')}
              </ul>
            </div>
          </div>
          `] : ''}
          <div class="panel-block is-size-7" style="justify-content: center;">
            ${user && user.id === l.author_id ? EditButtons.for(this, l) : MeasureShareButtons.for(this, l)}
          </div>
        </nav>
        ${reps && reps[0] ? RepSidebar.for(this, l) : ''}
      </div>
    `
  }
}

class RepSidebar extends Component {
  render() {
    const rep = this.state.reps[0]
    return this.html`
      <div class="panel">
        <h3 class="panel-heading has-text-centered has-text-weight-semibold">Your Rep</h3>
        <div class="panel-block">
          <div>
            <p class="is-size-7">We'll notify <a href="/legislators">your representative</a> and hold them accountable by using your vote to calculate their <a href="https://blog.united.vote/2017/12/08/give-your-rep-an-f-introducing-united-legislator-grades/">representation score</a>.</p>
            <br />
            ${RepCard.for(this, { rep })}
          </div>
        </div>
      </div>
    `
  }
}

class VoteStats extends Component {
  render() {
    const { reps } = this.state
    const l = this.props
    return this.html`
      <div>
        <div class="columns is-gapless is-marginless">
          <div class="column is-one-third">
            <div class="has-text-left">${l.legislature_name.replace(' Congress', '')}</div>
          </div>
          <div class="column is-two-thirds">
            <div class="has-text-right has-text-left-mobile">${l.yeas} Yea <span class="has-text-grey-lighter">|</span> ${Number(l.nays) + Number(l.abstains)} Nay</div>
          </div>
        </div>
        ${reps && reps.length ? [`
        <div class="columns is-gapless is-marginless has-text-grey-light">
          <div class="column is-one-third">
            <div class="has-text-left">${reps[0] && reps[0].office_short_name}</div>
          </div>
          <div class="column is-two-thirds">
            <div class="has-text-right has-text-left-mobile">${l.constituent_yeas} Yea <span class="has-text-grey-lighter">|</span> ${Number(l.constituent_nays) + Number(l.constituent_abstains)} Nay</div>
          </div>
        </div>
        `] : ''}
        <div style="background-color: hsl(0, 0%, 86%); margin: .75rem 0; position: relative; border-radius: 2px; height: 6px; overflow: hidden;">
          <div style="${`position: absolute; top: 0; bottom: 0; left: 0; width: ${(l.yeas / (l.yeas + l.nays)) * 100}%; background-color: hsl(141, 71%, 48%);`}"></div>
          <div style="${`position: absolute; top: 0; bottom: 0; left: ${(l.yeas / (l.yeas + l.nays)) * 100}%; width: ${(l.nays / (l.yeas + l.nays)) * 100}%; background-color: hsl(348, 100%, 61%);`}"></div>
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
    return this.html`<a style="height: auto; white-space: normal; align-items: flex-start;" class=${voteBtnClass} href=${`/${s.type === 'PN' ? 'nominations' : 'legislation'}/${s.short_id}/vote`}>
      <span class="icon"><i class=${voteBtnIcon}></i></span>
      <span class="has-text-weight-semibold">${voteBtnTxt}</span>
    </a>`
  }
}

class RepCard extends Component {
  render() {
    const { rep } = this.props
    return this.html`
      <div>
        <div class="media" style="margin-bottom: .5rem;">
          <figure class="media-left" style="overflow: hidden; border-radius: 5px;">
            <p class="image is-64x64">
              <a href=${`/${rep.username}`}>
                <img src=${this.avatarURL(rep)}>
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
        <p class="is-size-7">
          <span class="has-text-grey">
          ${rep.representation_grade ?
            [`<span class="is-size-6 has-text-weight-bold">${ordinalSuffix(rep.representation_percentile)}</span> percentile among ${rep.office_chamber === 'Lower' ? 'House' : 'Senate'} ${rep.party_affiliation}s`] :
            `Need more constituent votes to calculate grade`}
          </span>
        </p>
      </div>
    `
  }
}
