const { capitalize, escapeHtml, handleForm, html, prettyShortId } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const timeAgo = require('timeago.js')
const voteView = require('./vote')
const signatureView = require('./signature')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faBoxBallot } = require('@fortawesome/pro-solid-svg-icons/faBoxBallot')
const { faVoteYea } = require('@fortawesome/free-solid-svg-icons/faVoteYea')
const { faVoteNay } = require('@fortawesome/pro-solid-svg-icons/faVoteNay')
const { faFileSignature } = require('@fortawesome/free-solid-svg-icons/faFileSignature')
const { faSignature } = require('@fortawesome/free-solid-svg-icons/faSignature')
const { faLandmarkAlt } = require('@fortawesome/pro-solid-svg-icons/faLandmarkAlt')
const { faCheck } = require('@fortawesome/pro-solid-svg-icons/faCheck')
const { faTimes } = require('@fortawesome/pro-solid-svg-icons/faTimes')
const { faPencilAlt } = require('@fortawesome/free-solid-svg-icons/faPencilAlt')

module.exports = (state, dispatch) => {
  const { actions, legislatures, loading, location } = state
  return html`
    <div class="section">
      <div class="container is-widescreen">
        <div class="columns">
          <div class="column is-one-quarter">
            <nav class="menu">
              <p class="menu-label">Activity</p>
              <ul class="menu-list">
                <li><a href="${location.path}" class="${!location.query.legislature ? 'is-active' : ''}">All</a></li>
                ${legislatures.map(({ id, name }) => html`
                  <li>
                    <a
                      class="${id === location.query.legislature ? 'is-active' : ''}"
                      href="${`${location.path}?legislature=${id}`}"
                    >${name}</a>
                  </li>
                `)}
              </ul>
              <p class="menu-label">Action</p>
              <ul class="menu-list">
                <li><a href="/petitions/create">Start a Petition</a></li>
                <li><a href="/petitions/import">Import a Petition</a></li>
                <li><a href="/legislation/create">Propose a Bill</a></li>
                <li><a href="/legislation/import">Import a Bill</a></li>
              </ul>
            </nav>
          </div>
          <div class="column is-half">
            ${loading.activity ? activityIndicator() : html``}
            ${!loading.activity && actions.length ? actionsView(state, dispatch) : html``}
            ${!loading.activity && !actions.length ? html`<p class="has-text-grey has-text-centered">Nothing to show.</p>` : html``}
          </div>
        </div>
      </div>
    </div>
  `
}

const actionsView = (state, dispatch) => {
  const { actions } = state
  return actions.map(actionView(state, dispatch))
}

const actionView = (state, dispatch) => (action) => {
  return html`
    <div class="card" style="margin-bottom: 1.5em;">
      <div class="card-header">
        <div class="card-header-title is-size-7">
          ${actionTitle(state, action)}
          <span>&nbsp;</span>
          <span class="has-text-weight-normal has-text-grey-light">${timeAgo().format(`${action.occurred_at}Z`)}</span>
        </div>
      </div>
      <div class="card-content">
          ${actionContent(state, action, dispatch)}
      </div>
    </div>
  `
}

const actionTitle = (state, action) => {
  const vote = state.votes[action.resource] || {}
  switch (action.action) {
    case 'vote-inherited':
      return html`
        <span class="has-text-weight-normal has-text-grey">
          <span class="icon is-small has-text-grey-light">
            ${icon(vote.measure.type === 'petition' ? faSignature : vote.position === 'yea' ? faVoteYea : vote.position === 'nay' ? faVoteNay : faBoxBallot)}
          </span>
          <span>${vote.measure.type === 'petition' ? 'Petition signature' : 'Vote'} inherited from your proxy</span>
          <span class="has-text-weight-semibold">${(action.relation || {}).name}</span>
        </span>
      `
    case 'measure-introduced':
      return html`
        <span class="has-text-weight-normal has-text-grey">
          <span class="icon is-small has-text-grey-light">${icon(faLandmarkAlt)}</span>
          <span>Bill introduced for</span>
          <span class="has-text-weight-semibold">${action.resource.legislature_name}</span>
          ${action.resource.sponsor ? html`
            <span>
              by <span class="has-text-weight-semibold">
                ${action.resource.sponsor.first_name} ${action.resource.sponsor.last_name}
              </span>
            </span>
          ` : html``}
        </span>
      `
    case 'measure-proposed':
      return html`
        <span class="has-text-weight-normal has-text-grey">
          <span class="icon is-small has-text-grey-light">${icon(action.resource.type === 'petition' ? faFileSignature : faLandmarkAlt)}</span>
          <span>${action.resource.type === 'petition' ? 'Petition started' : 'Bill proposed'} for </span>
          <span class="has-text-weight-semibold">${action.resource.legislature_name}</span>
          <span>
            by
            <a class="has-text-weight-semibold has-text-grey" href="${`/${action.resource.author.username}`}">
              ${action.resource.author.first_name} ${action.resource.author.last_name}
            </a>
          </span>
        </span>`
    default:
      return html``
  }
}

const actionContent = (state, action, dispatch) => {
  const vote = state.votes[action.resource] || {}
  switch (action.action) {
    case 'vote-inherited':
      return (vote.measure.type === 'petition' ? signatureView : voteView)({ ...state, vote, padded: false, displayTitle: true }, dispatch)
    case 'measure-introduced':
    case 'measure-proposed':
      const measureUrl = `/${action.resource.author && action.resource.author.username || 'legislation'}/${action.resource.short_id}`
      return html`
        <h4 class="has-text-weight-bold is-size-6" style="padding-bottom: .5em;">
          <a href="${measureUrl}">
            ${action.resource.author_id ? action.resource.title : `${prettyShortId(action.resource.short_id)} - ${action.resource.title}`}
          </a>
        </h4>
        ${action.resource.summary ? html`
          <div class="content has-text-grey-dark is-small">
            ${{ html: truncate(280, action.resource.summary) }}
          </div>
        ` : html``}
        <div class="field is-grouped is-grouped-multiline">
          <div class="control">
            <div class="field has-addons">
              <div class="control">
                <a class="button is-small" href="${measureUrl}">
                  <span class="icon has-text-grey-light">
                    ${icon(
                      action.resource.type === 'petition'
                        ? faPencilAlt
                        : action.resource.vote
                          ? action.resource.vote.position === 'yea'
                            ? faVoteYea
                            : action.resource.vote.position === 'nay' ? faVoteNay : faBoxBallot
                          : faBoxBallot
                    )}
                  </span>
                  <span>
                    ${action.resource.vote
                      ? action.resource.vote.delegate_rank === -1
                        ? action.resource.type === 'petition' ? 'Signed' : `Voted ${capitalize(action.resource.vote.position)}`
                        : `${action.resource.type === 'petition' ? 'Signed' : `Voted ${capitalize(action.resource.vote.position)}`} through your proxy ${action.resource.vote.delegate_name}`
                      : action.resource.type === 'petition' ? 'Sign petition' : 'Vote'}
                  </span>
                </a>
              </div>
              ${action.resource.vote ? html`
                <form
                  class="control"
                  method="POST"
                  action="${state.location.path}"
                  onchange=${handleForm(dispatch, {
                    type: 'vote:voted',
                    measure: action.resource,
                    position: action.resource.vote.position,
                    comment: action.resource.vote.comment,
                  })}
                >
                  <div class="select is-small">
                    <select name="public">
                      <option value="true" selected=${action.resource.vote.public}>Public</option>
                      <option value="false" selected=${!action.resource.vote.public}>Private</option>
                    </select>
                  </div>
                </form>
              ` : html``}
            </div>
          </div>
          <div class="control">
            ${action.resource.type === 'petition'
              ? html`
                  <div class="buttons has-addons">
                    <span class="button is-static is-small">
                      <span class="icon has-text-grey-light">${icon(faSignature)}</span>
                      <span>Signatures</span>
                    </span>
                    <a class="button has-text-grey is-small" href="${measureUrl}">
                      ${action.resource.yeas}
                    </a>
                  </div>
                `
              : html`
                  <div class="buttons has-addons">
                    <span class="button is-static is-small">
                      Votes
                    </span>
                    <a class="button has-text-grey is-small" href="${measureUrl}">
                      <span class="icon has-text-grey-light">${icon(faCheck)}</span>
                      <span>${action.resource.yeas}</span>
                      <span>&nbsp;</span>
                      <span class="icon has-text-grey-light">${icon(faTimes)}</span>
                      <span>${action.resource.nays}</span>
                    </a>
                  </div>
              `}
            </div>
          </div>
        </div>
      `
    default:
      return html``
  }
}

const truncate = (length, str) => {
  return escapeHtml(str.slice(0, length))
}
