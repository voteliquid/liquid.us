const { APP_NAME, WWW_URL } = process.env
const { avatarURL, capitalize, html } = require('../helpers')
const stateNames = require('datasets-us-states-abbr-names')
const editButtons = require('./measure-edit-buttons')
const shareButtons = require('./measure-share-buttons')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faExternalLinkAlt } = require('@fortawesome/free-solid-svg-icons/faExternalLinkAlt')
const { faCheckCircle } = require('@fortawesome/free-regular-svg-icons/faCheckCircle')
const { faCircle } = require('@fortawesome/free-regular-svg-icons/faCircle')

module.exports = (state, dispatch) => {
  const { measure } = state
  const l = measure
  const reps = state.reps.filter(({ chamber, legislature }) => {
    return chamber === l.chamber && legislature.name === l.legislature_name
  })
  const showStatusTracker = l.introduced_at && l.type === 'bill'

  let measureUrl = `/${l.author_username}/`
  if (!l.author_username) {
    measureUrl = l.type === 'nomination' ? '/nominations/' : '/legislation/'
  }
  measureUrl += l.short_id

  return html`
    <nav class="panel">
      <div class="panel-heading has-text-centered">
        <h3 class="title has-text-weight-semibold is-size-5">
          <a href="${measureUrl}" class="has-text-dark">
            ${sidebarTitle(l)}
          </a>
        </h3>
        <h4 class="subtitle is-size-7 has-text-grey is-uppercase has-text-weight-semibold">
          ${l.type === 'petition' ? 'to ' : ''}${stateNames[l.legislature_name] || l.legislature_name}
        </h4>
      </div>
      ${reps && reps.length ? measureRepsPanel({ measure, reps }) : ''}
      ${measureVoteCounts(measure)}
      ${showStatusTracker ? measureStatusPanel(measure) : ''}
      ${measure.sponsor || measure.author ? measureSponsorPanel(measure) : ''}
      ${!l.author_id ? measureLinksPanel(measure) : ''}
      ${measureActionsPanel(state, dispatch)}
    </nav>
  `
}

function sidebarTitle(measure) {
  switch (measure.type) {
    case 'petition':
      return 'Petition'
    case 'bill':
    default:
      if (measure.introduced_at) {
        return measure.short_id.replace(/^[^-]+-(\D+)(\d+)/, '$1 $2').toUpperCase()
      }
      return 'Proposed Legislation'
  }
}

const panelTitleBlock = (title) => html`
  <div class="panel-block has-background-light">
    <div class="is-size-7 is-uppercase has-text-weight-semibold has-text-grey">${title || ''}</div>
  </div>
`

const measureActionsPanel = (state, dispatch) => {
  const { measure, user } = state
  const { author_id } = measure
  return html`
    <div class="panel-block is-size-7 has-background-light" style="justify-content: center;">
      ${user && user.id === author_id ? editButtons(user, measure, dispatch) : shareButtons(measure)}
    </div>
  `
}

const measureStatusPanel = (measure) => {
  const l = measure
  const steps = [{ step: 'Introduced', fulfilled: l.introduced_at }]

  if (l.chamber === 'Upper') {
    steps.push({ step: 'Passed Senate', fulfilled: l.passed_upper_at })
    steps.push({ step: 'Passed House', fulfilled: l.passed_lower_at })
  } else {
    steps.push({ step: 'Passed House', fulfilled: l.passed_lower_at })
    steps.push({ step: 'Passed Senate', fulfilled: l.passed_upper_at })
  }

  steps.push({ step: 'Enacted', fulfilled: l.enacted_at })

  return html`
    ${panelTitleBlock('Status')}
    <div class="panel-block">
      <ul style="width: 100%;">
        ${steps.map(({ fulfilled, step }) => {
          return html`
            <li class="${`step ${fulfilled ? 'fulfilled' : 'has-text-grey'}`}">
              <div class="columns is-gapless is-multiline is-mobile">
                <div class="column is-two-thirds">
                  <span class="icon is-small">${fulfilled ? icon(faCheckCircle) : icon(faCircle)}</span>
                  <span>${step}</span>
                </div>
                <div class="column is-one-third has-text-right">
                  <span>${fulfilled ? new Date(fulfilled).toLocaleDateString() : ''}</span>
                </div>
              </div>
            </li>
          `
        })}
      </ul>
    </div>
  `
}

const measureVoteCounts = (measure) => {
  const { legislature_name, delegate_name, yeas, nays, voteCounts = [], vote } = measure

  return html`
    ${panelTitleBlock('Votes')}
    <div class="panel-block">
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
          ${vote ? html`
          <tr>
            <td class="has-text-left has-text-grey">Your Vote</td>
            <td colspan="2" class="has-text-right">
              <span class="${`${vote.position === 'yea' ? 'has-text-success' : 'has-text-danger'} has-text-weight-semibold`}">${capitalize(vote.position)}</span>
            </td>
          </tr>
          ${delegate_name ? html`<tr><td colspan="3" class="has-text-grey">Inherited from ${delegate_name}</td></tr>` : ''}
          <tr><td colspan="3">&nbsp;</td><tr/>
          ` : ''}
          <tr class="has-text-grey">
            <td class="has-text-left">${APP_NAME}</td>
            <td class="has-text-right">Yea</td>
            <td class="has-text-right">Nay</td>
          </tr>
          <tr>
            <td class="has-text-left has-text-grey">${legislature_name}</td>
            <td class="has-text-right">${yeas || 0}</td>
            <td class="has-text-right">${nays || 0}</td>
          </tr>
          ${voteCounts.map(({ yeas, nays, office_name, legislature_name }) => html`
            <tr>
              <td class="has-text-left has-text-grey">${office_name || legislature_name}</td>
              <td class="has-text-right">${yeas || 0}</td>
              <td class="has-text-right">${nays || 0}</td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `
}

const measureSponsorPanel = (measure) => {
  const { author, sponsor } = measure
  return html`
    ${panelTitleBlock(author ? 'Author' : 'Sponsor')}
    <div class="panel-block">
      ${repSnippet(author || sponsor)}
    </div>
  `
}

const measureLinksPanel = (measure) => {
  const url = measure.source_url || `${WWW_URL}/legislation/${measure.short_id}`
  const domain = url.replace(/https?:\/\/(www\.)?/i, '').split('/')[0]
  return html`
    ${panelTitleBlock('Links')}
    <div class="panel-block">
      <div class="columns is-gapless is-multiline is-mobile" style="width: 100%;">
        <div class="column is-one-third"><div class="has-text-grey">Full text</div></div>
        <div class="column is-two-thirds">
          <div class="has-text-right">
            <a href="${url}">
              ${domain}
              <span class="icon is-small">${icon(faExternalLinkAlt)}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `
}

const measureRepsPanel = ({ measure, reps }) => {
  return html`
    <div class="panel-block">
      <div>
        <h4 class="has-text-centered has-text-weight-semibold" style="margin: 0 0 .5rem;">
          ${measure.vote
          ? `We told your rep${reps.length > 1 ? 's' : ''} to vote ${measure.vote.position}`
          : `Vote to tell your rep${reps.length > 1 ? 's' : ''}`}
        </h4>
        ${reps.map((rep) => repSnippet(rep.office_holder))}
      </div>
    </div>
  `
}

const repSnippet = (rep) => html`
  <div>
    <div class="media" style="margin-bottom: .5rem;">
      <figure class="media-left" style="overflow: hidden; border-radius: 5px;">
        <p class="image is-64x64">
          <a href=${`/${rep.username}`}>
            <img src=${avatarURL(rep)} />
          </a>
        </p>
      </figure>
      <div class="media-content">
        <a href=${`/${rep.username}`}>
          <strong>${rep.first_name} ${rep.last_name}</strong>
        </a>
        ${rep.elected_office_name ? html`<p class="is-size-7">${rep.elected_office_name}</p>` : ''}
      </div>
    </div>
  </div>
`
