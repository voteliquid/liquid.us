const { escapeHtml, html } = require('../helpers')
const activityIndicator = require('./activity-indicator')
const timeAgo = require('timeago.js')
const voteView = require('./vote')

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
                <li><a href="/legislation/create">Propose a Bill</a></li>
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
  switch (action.action) {
    case 'vote-inherited':
      return html`
        <span class="has-text-weight-normal has-text-grey">
          Inherited vote from <span class="has-text-weight-semibold">${(action.relation || {}).name}</span>
        </span>
      `
    case 'measure-introduced':
      return html`
        <span class="has-text-weight-normal has-text-grey">
          Bill introduced for ${action.resource.legislature_name}
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
          ${action.resource.type === 'petition' ? 'Petition started for' : 'Bill proposed for'}
          ${action.resource.legislature_name} by
          <a class="has-text-weight-semibold has-text-grey" href="${`/${action.resource.author.username}`}">
            ${action.resource.author.first_name} ${action.resource.author.last_name}
          </a>
        </span>`
    default:
      return html``
  }
}

const actionContent = (state, action, dispatch) => {
  switch (action.action) {
    case 'vote-inherited':
      return voteView({ ...state, vote: state.votes[action.resource], padded: false, showBill: true }, dispatch)
    case 'measure-introduced':
    case 'measure-proposed':
      return html`
        <h4 class="has-text-weight-bold is-size-6" style="padding-bottom: .5em;">
          <a href="${`/${action.resource.author_username || 'legislation'}/${action.resource.short_id}`}">
            ${action.resource.title}
          </a>
        </h4>
        ${action.resource.summary ? html`
          <div class="content has-text-grey-dark is-small">
            ${{ html: truncate(280, action.resource.summary) }}
          </div>
        ` : html``}
      `
    default:
      return html``
  }
}

const truncate = (length, str) => {
  return escapeHtml(str.slice(0, length))
}
