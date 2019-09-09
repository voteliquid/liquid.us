const { APP_NAME } = process.env
const { avatarURL, handleForm, html } = require('../helpers')
const { icon } = require('@fortawesome/fontawesome-svg-core')
const { faUser } = require('@fortawesome/free-solid-svg-icons/faUser')
const { faTwitter } = require('@fortawesome/free-brands-svg-icons/faTwitter')
const { faExclamationTriangle } = require('@fortawesome/free-solid-svg-icons/faExclamationTriangle')
const { faEnvelope } = require('@fortawesome/free-solid-svg-icons/faEnvelope')
const { faHandshake } = require('@fortawesome/free-solid-svg-icons/faHandshake')
const { faPlus } = require('@fortawesome/free-solid-svg-icons/faPlus')
const { faTimes } = require('@fortawesome/free-solid-svg-icons/faTimes')

module.exports = (state, dispatch) => {
  const { location } = state
  const tab = location.query.tab || 'search'
  const path = location.path

  return html`
    <div>
      <div class="tabs">
        <ul>
          <li class=${tab === 'search' ? 'is-active' : ''}><a href=${`${path}?tab=search`}>Search by Name</a></li>
          <li class=${tab === 'email' ? 'is-active' : ''}><a href=${`${path}?tab=email`}>Invite by Email</a></li>
          <li class=${tab === 'twitter' ? 'is-active' : ''}><a href=${`${path}?tab=twitter`}>Invite by Twitter</a></li>
        </ul>
      </div>
      ${tab === 'email' ? addProxyByEmailForm(state, dispatch) : []}
      ${tab === 'twitter' ? addProxyByTwitterForm(state, dispatch) : []}
      ${tab === 'search' ? addProxyBySearchForm(state, dispatch) : []}
    </div>
  `
}

const addProxyByEmailForm = (state, dispatch) => {
  const { error } = state

  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:addedProxyViaEmail' })}>
      <label for="add_proxy[search]" class="label has-text-weight-normal">Proxy to someone not on ${APP_NAME} via email:</label>
      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field">
            <div class="control has-icons-left">
              <input autocomplete="off" name="add_proxy[name]" class=${`input ${error && error.name ? 'is-danger' : ''}`} type="text" placeholder="First and Last Name" />
              ${error && error.name
                ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
                : html`<span class="icon is-small is-left">${icon(faUser)}</span>`
              }
              ${error && error.name ? html`<p class="help is-danger">${error.message}</p>` : ''}
            </div>
          </div>
          <div class="field">
            <div class="control has-icons-left">
              <input autocomplete="off" name="add_proxy[email]" class=${`input ${error && error.email ? 'is-danger' : ''}`} type="text" required placeholder="Email" />
              ${error && error.email
                ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
                : html`<span class="icon is-small is-left">${icon(faEnvelope)}</span>`
              }
              ${error && error.email ? html`<p class="help is-danger">${error.message}</p>` : ''}
            </div>
          </div>
          <div class="field">
            <div class="control">
              <button class="button is-link is-outlined">
                <span class="icon is-small" style="margin-left:0 !important;">${icon(faHandshake)}</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p class="is-size-7">They'll be sent an <strong>invitation email</strong>. You'll be BCC'd.</p>
    </form>
  `
}

const addProxyByTwitterForm = (state, dispatch) => {
  const { error } = state
  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:addedProxyViaTwitter' })}>
      <label for="add_proxy[search]" class="label has-text-weight-normal">Proxy to someone not on ${APP_NAME} by adding their Twitter username:</label>
      <div class="field is-horizontal">
        <div class="field-body">
          <div class="field is-grouped">
            <div class="control is-expanded has-icons-left">
              <input autocomplete="off" name="add_proxy[twitter_username]" class=${`input ${error && error.email ? 'is-danger' : ''}`} type="text" required placeholder="Twitter @username" />
              ${error && error.message
                ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
                : html`<span class="icon is-small is-left">${icon(faTwitter)}</span>`
              }
              ${error && error.message ? html`<p class="help is-danger">${error.message}</p>` : ''}
            </div>
            <div class="control">
              <button class="button is-link is-outlined" type="submit">
                <span class="icon is-small" style="margin-left:0 !important;">${icon(faHandshake)}</span>
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <p class="is-size-7">They'll be sent an <a href="https://twitter.com/liquid_notifs" target="_blank"><strong>invitation tweet</strong></a>.</p>
    </form>
  `
}

const addProxyBySearchForm = (state, dispatch) => {
  const { error, loading, proxies, proxySearchResults = [], proxySearchTerms } = state

  return html`
    <script>
      var autoSubmitProxySearchTimeout;
      function autoSubmitProxySearch(event) {
        if (autoSubmitProxySearchTimeout) {
          clearTimeout(autoSubmitProxySearchTimeout);
        }
        autoSubmitProxySearchTimeout = setTimeout(function () {
          var el = document.getElementById('search_proxy_submit');
          if (el) el.click();
        }, 750);
      }
    </script>
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:searched' })}>
      <label for="add_proxy[search]" class="label has-text-weight-normal">Search for new proxies among public ${APP_NAME} profiles:</label>
      <div class="field has-addons">
        <div class="${`control is-expanded has-icons-left ${loading.proxySearch ? 'is-loading' : ''}`}">
          <input autocomplete="off" onkeypress="autoSubmitProxySearch()" name="add_proxy[search]" class=${`input ${error && error.email ? 'is-danger' : ''}`} type="text" placeholder="Name or @username" />
          ${error && error.message
            ? html`<span class="icon is-small is-left">${icon(faExclamationTriangle)}</span>`
            : html`<span class="icon is-small is-left">${icon(faUser)}</span>`
          }
          ${error && error.message ? html`<p class="help is-danger">${error.message}</p>` : ''}
        </div>
        <div class="control">
          <button id="search_proxy_submit" type="submit" class="button">
            <span>Search</span>
          </button>
        </div>
      </div>
    </form>
    <br />
    <div>
      ${proxySearchTerms && !proxySearchResults.length ? html`<p>No results for "<strong>${proxySearchTerms}</strong>"</p>` : ''}
      ${proxySearchResults.map(result => searchResult(proxies, result, dispatch))}
      ${proxySearchTerms ? html`<br /><p class="notification has-text-grey">Can't find who you're looking for?<br />Invite them by <a href="?tab=email">email</a> or <a href="?tab=twitter">Twitter username</a>.</p>` : ''}
    </div>
  `
}

const searchResult = (proxies, result, dispatch) => {
  const { first_name, id, last_name, username, twitter_username } = result

  return html`
    <div class="media">
      <div class="media-left">
        <div class="image is-32x32">
          ${username || twitter_username
          ? html`
            <a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
              <img src=${avatarURL(result)} class="is-rounded" />
            </a>
          ` : html`
            <img src=${avatarURL(result)} class="is-rounded" />
          `}
        </div>
      </div>
      <div class="media-content">
        <a href="${username ? `/${username}` : `/twitter/${twitter_username}`}" target="_blank">
          <span>${first_name} ${last_name}</span>
          <span class="has-text-grey is-size-7">@${username || twitter_username}</span>
        </a>
      </div>
      <div class="media-right">
        ${proxies.some(({ to_id }) => to_id === id)
        ? searchResultAdded({ id, proxies }, dispatch) : searchResultAdd(id, dispatch)}
      </div>
    </div>
  `
}

const searchResultAdd = (id, dispatch) => {
  return html`
    <form method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:addedProxyViaSearch' })}>
      <input name="add_proxy[to_id]" type="hidden" value="${id}" />
      <button class="button is-outline is-small" type="submit">
        <span class="icon">${icon(faPlus)}</span>
        <span>Add</span>
      </button>
    </form>
  `
}

const removeProxyButton = (id, dispatch) => {
  return html`
    <form style="display: inline;" method="POST" onsubmit=${handleForm(dispatch, { type: 'proxy:removed' })}>
      <input value="${id}" name="remove_delegation[to_id]" type="hidden" />
      <button class="button is-small" type="submit">
        <span class="icon has-text-grey">${icon(faTimes)}</span>
      </button>
    </form>
  `
}

const searchResultAdded = ({ id, proxies }, dispatch) => {
  return html`
    <form style="display: inline;" method="POST">
      <input name="add_proxy[to_id]" type="hidden" value="${id}" />
      <button class="button is-small" disabled type="submit">
        <span class="icon">${icon(faHandshake)}</span>
        <span>Added</span>
      </button>
    </form>
    ${proxies.some(d => d.to_id === id) ? removeProxyButton(id, dispatch) : []}
  `
}
