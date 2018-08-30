const Component = require('./Component')
const EditButtons = require('./EditMeasureButtons')
const MeasureShareButtons = require('./MeasureShareButtons')

module.exports = class MeasureDetailsSidebar extends Component {
  render() {
    const l = this.props
    const { user } = this.props
    const reps = (this.state.reps || []).filter(({ office_chamber, legislature_name }) => office_chamber === l.chamber && legislature_name === l.legislature_name)
    const showStatusTracker = l.legislature_name === 'U.S. Congress' && l.introduced_at && (l.type === 'HR' || l.type === 'S')

    return this.html`
      <nav class="panel">
        <div class="panel-heading has-text-centered">
          <h3 class="title has-text-weight-semibold is-size-5">
            ${l.introduced_at ? `${l.type} ${l.number}` : 'Proposed'}
          </h3>
          <h4 class="subtitle is-size-7 has-text-grey is-uppercase has-text-weight-semibold">
            ${l.legislature_name}
          </h4>
        </div>
        ${reps && reps.length ? MeasureRepsPanel.for(this, { measure: l, reps }) : ''}
        ${PanelTitleBlock.for(this, { title: 'Votes' }, 'title-votes')}
        ${MeasureVoteCounts.for(this, { measure: l, reps })}
        ${PanelTitleBlock.for(this, { title: `${l.type === 'PN' ? 'Nomination' : 'Bill'} Info` }, 'title-info')}
        ${MeasureInfoPanel.for(this, { measure: l, showStatusTracker })}
        ${MeasureActionsPanel.for(this, { measure: l, user })}
      </nav>
    `
  }
}

class PanelTitleBlock extends Component {
  render() {
    return this.html`<div class="panel-block has-background-light">
      <div class="is-size-7 is-uppercase has-text-weight-semibold has-text-grey">${this.props.title || ''}</div>
    </div>`
  }
}

class MeasureActionsPanel extends Component {
  render() {
    const { measure: l, user } = this.props
    return this.html`
      <div class="panel-block is-size-7 has-background-light" style="justify-content: center;">
        ${user && user.id === l.author_id ? EditButtons.for(this, l) : MeasureShareButtons.for(this, l)}
      </div>
    `
  }
}

class MeasureStatus extends Component {
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
      <div style="padding-top: 1rem;">
        <ul>
          ${steps.map(({ fulfilled, step }) => {
            return `<li class="${`step ${fulfilled ? 'fulfilled' : 'has-text-grey'}`}">
              <span class="icon is-small"><i class="fa ${fulfilled ? 'fa-check-circle-o' : 'fa-circle-o'}"></i></span>
              <span>${step}</span>
            </li>`
          })}
        </ul>
      </div>
    `
  }
}

class MeasureInfoPanel extends Component {
  render() {
    const { measure, showStatusTracker } = this.props
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
        if (legislature_name === 'California Congress') {
          bill_details_name = 'leginfo.legislature.ca.gov'
          bill_details_url = `https://leginfo.legislature.ca.gov/faces/billTextClient.xhtml?bill_id=${congress}0${type}${number}`
        }
      }
    }

    return this.html`
      <div class="panel-block">
        <div style="width: 100%;">
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
              <div class="column is-one-third"><div class="has-text-grey">Full text</div></div>
              <div class="column is-two-thirds">
                <div class="has-text-right">
                  <a href="${bill_details_url}">${bill_details_name}</a>
                </div>
              </div>
            `] : ''}
            ${showStatusTracker ? MeasureStatus.for(this, { measure }) : ''}
          </div>
        </div>
      </div>
    `
  }
}

class MeasureVoteCounts extends Component {
  render() {
    const { APP_NAME } = this.state.config
    const { measure, reps = [] } = this.props
    const { type, constituent_yeas, constituent_nays, yeas, nays, legislature_name, chamber } = measure

    const localLegislatureName = reps[0] && reps[0].office_short_name
    const chamberNames = {
      'U.S. Congress': { Upper: 'Senate', Lower: 'House' },
      'California Congress': { Upper: 'Senate', Lower: 'Assembly' },
    }

    return this.html`
      <div class="panel-block">
        <div style="width: 100%;">
          <style>
            .vote-table.is-narrow tr td {
              border-bottom: none;
              padding: 0 0 0 .5rem;
            }
            .vote-table.is-narrow tr td:first-child {
              padding: 0;
            }
          </style>
          <table class="table vote-table is-narrow is-fullwidth">
            <tbody>
              <tr class="has-text-grey">
                <td class="has-text-left">${APP_NAME}</td>
                <td class="has-text-right">Yea</td>
                <td class="has-text-right">Nay</td>
              </tr>
              <tr>
                <td class="has-text-left has-text-grey">${legislature_name.replace(' Congress', '')}</td>
                <td class="has-text-right">${yeas || 0}</td>
                <td class="has-text-right">${nays || 0}</td>
              </tr>
              ${reps.length ? [`
              <tr>
                <td class="has-text-left has-text-grey">${localLegislatureName}</td>
                <td class="has-text-right">${constituent_yeas || 0}</td>
                <td class="has-text-right">${constituent_nays || 0}</td>
              </tr>
              `] : ''}
              ${legislature_name === 'U.S. Congress' ? [`
              <tr><td colspan="3">&nbsp;</td><tr/>
              <tr>
                <td colspan="3" class="has-text-left has-text-grey">${legislature_name}</td>
              </tr>
              <tr>
                <td colspan="${!measure.lower_yeas && !measure.lower_nays ? 3 : 1}" class="has-text-left has-text-grey">
                  ${chamberNames[legislature_name].Lower}
                  ${measure.lower_yeas ? '' : measure.passed_lower_at ? ' passed unanimously' : ' has not voted'}
                </td>
                ${measure.lower_yeas || measure.lower_nays ? `
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'upper' : 'lower'}_yeas`] || ''}</td>
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'upper' : 'lower'}_nays`] || ''}</td>
                ` : ''}
              </tr>
              ${type !== 'PN' ? [`
              <tr>
                <td colspan="${!measure.upper_yeas && !measure.upper_nays ? 3 : 1}" class="has-text-left has-text-grey">
                  ${chamberNames[legislature_name].Upper}
                  ${measure.upper_yeas ? '' : measure.passed_upper_at ? ' passed unanimously' : ' has not voted'}
                </td>
                ${measure.upper_yeas || measure.upper_nays ? `
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'lower' : 'upper'}_yeas`] || ''}</td>
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'lower' : 'upper'}_nays`] || ''}</td>
                ` : ''}
              </tr>
              `] : ''}
              `] : ''}
            </tbody>
          </table>
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
