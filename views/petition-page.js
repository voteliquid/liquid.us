const { ASSETS_URL } = process.env
const { avatarURL, html } = require('../helpers')
const signatureCount = require('./petition-signature-count')
const measureSummary = require('./measure-summary')
const sidebar = require('./petition-page-sidebar')
const stateAbbreviations = require('datasets-us-states-names-abbr')
const daneTargetReps = require('./dane-county-targetReps')
const commentsView = require('./measure-comments')
const signaturesView = require('./measure-votes')

module.exports = (state, dispatch) => {
  const { location, measures, user } = state
  const measure = measures[location.params.shortId]
  const hideTargetReps = (l) => l.author_username === 'councilmemberbas'
  const isDane = (l) => l.short_id === 'press-pause-on-227m-new-jail'
  const measureUrl = `/${measure.author.username}/${measure.short_id}`
  const tab = location.query.tab || 'comments'
  const path = location.path
  const isOwnPetition = user && user.id === measure.author_id
  const commentCount = measure.commentsPagination ? measure.commentsPagination.count : 0
  const signatureCount = measure.voteCounts && measure.voteCounts[0] && measure.voteCounts[0].yeas

  return html`
    <section class="section">
      <div class="container">
        <h2 class="title has-text-weight-semibold is-2 has-text-centered has-text-left-mobile has-text-dark">
          ${measure.title}
        </h2>
        <div class="columns">
          <div class="column">
            ${hideTargetReps(measure) ? ''
            : isDane(measure) ? daneTargetReps({ measure, ...state })
              : targetReps({ measure, ...state }, dispatch)
            }
            <hr />
            ${measureSummary({ measure, size: 5 }, dispatch)}
            <div class="is-hidden-tablet">
              ${measure.showMobileEndorsementForm ? '' : mobileHoverBar(measure, dispatch)}
            </div>
            <div>
              <div class="tabs is-centered is-boxed">
                <ul>
                  <li class=${tab === 'comments' ? 'is-active' : ''}>
                    <a href=${path}>Comments${commentCount ? ` (${commentCount})` : ''}</a>
                  </li>
                  <li class=${tab === 'votes' ? 'is-active' : ''}>
                    <a href=${`${path}?tab=votes`}>Signatures${signatureCount ? ` (${signatureCount})` : ''}</a>
                  </li>
                  ${isOwnPetition ? html`
                    <li><a href=${`${measureUrl}/edit`}>Manage</a></li>
                  ` : html``}
                </ul>
              </div>
              ${tab === 'votes' ? signaturesView({ ...state, displayPosition: false }, dispatch) : commentsView({ displayFilters: false, ...state }, dispatch)}
            </div>
          </div>
          <div class="${`column ${measure.showMobileEndorsementForm ? '' : 'is-hidden-mobile'} is-one-third is-one-quarter-widescreen`}">
            ${sidebar({ ...state, measure }, dispatch)}
          </div>
        </div>
      </div>
    </section>
  `
}

const notYourRepsMessage = (measure, dispatch) => {
  const { notYourRepsMessageVisible } = measure

  return html`
    <p class="is-size-7" style="position: relative; bottom: 1rem;">
      <a onclick=${(event) => dispatch({ type: 'petition:toggledRepsMessage', measure, event })}>Not your representatives?</a>
      ${notYourRepsMessageVisible ? html`
        <span class="has-text-weight-semibold">Enter your address when signing the petition to send to your correct reps.</span>
      ` : ''}
    </p>
  `
}

const targetReps = ({ measure, reps, user }, dispatch) => {
  const targetReps = reps.filter(r =>
    r.legislature.short_name === measure.legislature_name
    || r.legislature.name === measure.legislature_name
  )
  const authorName = `${measure.author.first_name} ${measure.author.last_name}`
  return html`
    <div>
      <div style="margin-bottom: .5em;">
        <a href="${`/${measure.author.username}`}" class="has-text-weight-bold">${authorName}</a>
        <span class="has-text-weight-normal">started this petition to:</span>
      </div>
      <div class="columns">
        ${targetReps.map(rep)}
        ${legislature(measure)}
      </div>
      ${!(user && user.address) ? notYourRepsMessage(measure, dispatch) : []}
    </div>
  `
}

const rep = (r) => {
  const rep = r.office_holder
  const position = r.name.split(' ').slice(2).join(' ')
  const isState = r.legislature.name !== 'U.S. Congress'
  const firstLine = `${rep.first_name} ${rep.last_name}`
  const secondLine = isState
    ? position
    : r.chamber === 'Upper' ? `Senator, ${r.short_name}` : `Rep., ${r.short_name}`

  return html.for(r)`
    <div class="column">
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32 is-clipped border-radius-small">
            <img src=${avatarURL(rep)} />
          </div>
        </div>
        <div class="media-content">
          <span class="has-text-weight-semibold">${firstLine}</span><br />
          <span class="has-text-grey">${secondLine}</span>
        </div>
      </div>
    </div>
  `
}

const legislature = (measure) => {
  const local = measure.legislature_name.includes(',') || measure.legislature_name.includes('County')
  const measureImage = local ? `${ASSETS_URL}/legislature-images/local.png` : `${ASSETS_URL}/legislature-images/${stateAbbreviations[measure.legislature_name] || 'U.S. Congress'}.png`

  return html`
    <div class="column">
      <div class="media">
        <div class="media-left">
          <div class="image is-32x32 border-radius-small">
            <img src=${measureImage} style="background: hsla(0, 0%, 87%, 0.5);"/>
          </div>
        </div>
        <div class="media-content has-text-weight-semibold">
          ${measure.legislature_name}
        </div>
      </div>
    </div>
  `
}

const mobileHoverBar = (measure, dispatch) => {
  let action = 'Sign Petition'; let color = 'is-success'
  if (measure.vote) { action = 'Share'; color = 'is-link' }

  return html`
    <div style="
      position: fixed;
      left: 0; bottom: 0;
      width: 100%;
      z-index: 18;
      background: white;
      border-top: 1px solid #eee;
      padding: 10px 15px;
    ">
      ${signatureCount(measure)}
      <div class="field">
        <div class="control">
          <button
            class=${`button ${color} is-fullwidth fix-bulma-centered-text has-text-weight-bold is-size-5`}
            onclick=${(event) => dispatch({ type: 'petition:toggledMobileEndorsementForm', measure, event })}
          >
            ${action}
          </button>
        </div>
      </div>
    </div>
  `
}
