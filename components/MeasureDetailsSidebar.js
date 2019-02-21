const stateNames = require('datasets-us-states-abbr-names')
const stateAbbr = require('datasets-us-states-names-abbr')

const Component = require('./Component')
const EditButtons = require('./EditMeasureButtons')
const MeasureShareButtons = require('./MeasureShareButtons')

module.exports = class MeasureDetailsSidebar extends Component {
  render() {
    const l = this.props
    const { user } = this.props
    const reps = (this.state.reps || []).filter(({ chamber, legislature }) => {
      return chamber === l.chamber && (stateAbbr[legislature.name] || legislature.name) === l.legislature_name
    })
    const showStatusTracker = l.legislature_name === 'U.S. Congress' && l.introduced_at && l.type === 'bill'
    const measureUrl = l.author_username
      ? `/${l.author_username}/${l.type === 'nomination' ? 'nominations' : 'legislation'}/${l.short_id}`
      : `/${l.type === 'nomination' ? 'nominations' : 'legislation'}/${l.short_id}`

    return this.html`
      <nav class="panel">
        <div class="panel-heading has-text-centered">
          <h3 class="title has-text-weight-semibold is-size-5">
            <a href="${measureUrl}" class="has-text-dark">
              ${l.introduced_at ? `${l.short_id.replace(/^[^-]+-(\D+)(\d+)/, '$1 $2').toUpperCase()}` : (l.short_id === 'should-nancy-pelosi-be-speaker' ? 'Proposed Nomination' : 'Proposed Legislation')}
            </a>
          </h3>
          <h4 class="subtitle is-size-7 has-text-grey is-uppercase has-text-weight-semibold">
            ${stateNames[l.legislature_name] || l.legislature_name}
          </h4>
        </div>
        ${reps && reps.length ? MeasureRepsPanel.for(this, { measure: l, reps }) : ''}
        ${PanelTitleBlock.for(this, { title: 'Votes' }, 'title-votes')}
        ${MeasureVoteCounts.for(this, { measure: l, offices: this.state.offices })}
        ${PanelTitleBlock.for(this, { title: 'Info' }, 'title-info')}
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
        ${user && user.id === l.author_id && !l.published ? EditButtons.for(this, l) : MeasureShareButtons.for(this, l)}
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
              <span class="icon is-small"><i class="far ${fulfilled ? 'fa-check-circle' : 'fa-circle'}"></i></span>
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
        if (type === 'bill') {
          bill_details_url = `https://www.congress.gov/bill/${congress}th-congress/${chamber === 'Lower' ? 'house' : 'senate'}-bill/${number}`
        } else if (type === 'nomination') {
          bill_details_url = `https://www.congress.gov/nomination/${congress}th-congress/${number}`
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
    const { measure, offices = [] } = this.props
    const {
      type, constituent_yeas, constituent_nays, yeas, nays,
      legislature_name, chamber, delegate_name, vote_position, short_id
    } = measure
    const isCity = measure.legislature_name.includes(',')
    const upperChamber = measure.legislature_name === 'U.S. Congress' ? offices[2].short_name : isCity ? measure.legislature_name : offices[4].short_name
    const lowerChamber = measure.legislature_name === 'U.S. Congress' ? offices[0].short_name : isCity ? '' : offices[3].short_name
    const chamberNames = {
      'U.S. Congress': { Upper: 'Senate', Lower: 'House' },
      'CA': { Upper: 'Senate', Lower: 'Assembly' },
    }
    console.log(offices)

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
              ${vote_position ? [`
              <tr>
                <td class="has-text-left has-text-grey">Your Vote</td>
                <td colspan="2" class="has-text-right">
                  <a class="${`${vote_position === 'yea' ? 'has-text-success' : 'has-text-danger'} has-text-weight-semibold`}" href="${`/${type === 'nomination' ? 'nominations' : 'legislation'}/${short_id}/vote`}">${this.capitalize(vote_position)}</a>
                </td>
              </tr>
              ${delegate_name ? [`<tr><td colspan="3" class="has-text-grey">Inherited from ${delegate_name}</td></tr>`] : ''}
              <tr><td colspan="3">&nbsp;</td><tr/>
              `] : ''}
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
              ${offices.length && upperChamber ? [`
              <tr>
                <td class="has-text-left has-text-grey">${measure.chamber === 'Upper' ? upperChamber : lowerChamber}</td>
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
                <td class="has-text-left has-text-grey">
                  ${chamberNames[legislature_name].Lower}
                </td>
                ${measure.lower_yeas || measure.lower_nays ? `
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'upper' : 'lower'}_yeas`] || ''}</td>
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'upper' : 'lower'}_nays`] || ''}</td>
                ` : `
                <td class="has-text-right" colspan="2">
                  ${measure.lower_yeas ? '' : measure.passed_lower_at ? 'Passed unanimously' : 'No vote yet'}
                </td>
                `}
              </tr>
              ${type !== 'nomination' ? [`
              <tr>
                <td class="has-text-left has-text-grey">
                  ${chamberNames[legislature_name].Upper}
                </td>
                ${measure.upper_yeas || measure.upper_nays ? `
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'lower' : 'upper'}_yeas`] || ''}</td>
                <td class="has-text-right">${measure[`${chamber === 'Upper' ? 'lower' : 'upper'}_nays`] || ''}</td>
                ` : `
                <td class="has-text-right" colspan="2">
                  ${measure.upper_yeas ? '' : measure.passed_upper_at ? 'Passed unanimously' : ' No vote yet'}
                </td>
                `}
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

class MeasureRepsPanel extends Component {
  render() {
    const { measure, reps = [] } = this.props
    return this.html`
      <div class="panel-block">
        <div>
          <h4 class="has-text-centered has-text-weight-semibold" style="margin: 0 0 .5rem;">
            ${measure.vote_position
            ? `We told your rep${reps.length > 1 ? 's' : ''} to vote ${measure.vote_position}`
            : `Vote to tell your rep${reps.length > 1 ? 's' : ''}`}
          </h4>
          ${reps.map((rep) => RepSnippet.for(this, { rep: rep.office_holder, office: rep }, `sidebar-rep-${rep.office_holder.user_id}`))}
        </div>
      </div>
    `
  }
}

class RepSnippet extends Component {
  render() {
    const { rep, office } = this.props
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
            <p class="is-size-7">${office.name}</p>
          </div>
        </div>
      </div>
    `
  }
}
